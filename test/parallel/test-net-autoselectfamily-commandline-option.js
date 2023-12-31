'use strict';

// Flags: --no-network-family-autoselection

const common = require('../common');
const { parseDNSPacket, writeDNSPacket } = require('../common/dns');

const assert = require('assert');
const dgram = require('dgram');
const { Resolver } = require('dns');
const { createConnection, createServer } = require('net');

// Test that happy eyeballs algorithm can be enable from command line.

function _lookup(resolver, hostname, options, cb) {
  resolver.resolve(hostname, 'ANY', (err, replies) => {
    assert.notStrictEqual(options.family, 4);

    if (err) {
      return cb(err);
    }

    const hosts = replies
      .map((r) => ({ address: r.address, family: r.type === 'AAAA' ? 6 : 4 }))
      .sort((a, b) => b.family - a.family);

    if (options.all === true) {
      return cb(null, hosts);
    }

    return cb(null, hosts[0].address, hosts[0].family);
  });
}

function createDnsServer(ipv6Addr, ipv4Addr, cb) {
  // Create a DNS server which replies with a AAAA and a A record for the same host
  const socket = dgram.createSocket('udp4');

  socket.on('message', common.mustCall((msg, { address, port }) => {
    const parsed = parseDNSPacket(msg);
    const domain = parsed.questions[0].domain;
    assert.strictEqual(domain, 'example.org');

    socket.send(writeDNSPacket({
      id: parsed.id,
      questions: parsed.questions,
      answers: [
        { type: 'AAAA', address: ipv6Addr, ttl: 123, domain: 'example.org' },
        { type: 'A', address: ipv4Addr, ttl: 123, domain: 'example.org' },
      ]
    }), port, address);
  }));

  socket.bind(0, () => {
    const resolver = new Resolver();
    resolver.setServers([`127.0.0.1:${socket.address().port}`]);

    cb({ dnsServer: socket, lookup: _lookup.bind(null, resolver) });
  });
}

// Test that IPV4 is NOT reached if IPV6 is not reachable and the option has been disabled via command line
{
  createDnsServer('::1', '127.0.0.1', common.mustCall(function({ dnsServer, lookup }) {
    const ipv4Server = createServer((socket) => {
      socket.on('data', common.mustCall(() => {
        socket.write('response-ipv4');
        socket.end();
      }));
    });

    ipv4Server.listen(0, '127.0.0.1', common.mustCall(() => {
      const port = ipv4Server.address().port;

      const connection = createConnection({
        host: 'example.org',
        port,
        lookup,
      });

      connection.on('ready', common.mustNotCall());
      connection.on('error', common.mustCall((error) => {
        assert.strictEqual(connection.autoSelectFamilyAttemptedAddresses, undefined);

        if (common.hasIPv6) {
          assert.strictEqual(error.code, 'ECONNREFUSED');
          assert.strictEqual(error.message, `connect ECONNREFUSED ::1:${port}`);
        } else if (error.code === 'EAFNOSUPPORT') {
          assert.strictEqual(error.message, `connect EAFNOSUPPORT ::1:${port} - Local (undefined:undefined)`);
        } else if (error.code === 'EUNATCH') {
          assert.strictEqual(error.message, `connect EUNATCH ::1:${port} - Local (:::0)`);
        } else {
          assert.strictEqual(error.code, 'EADDRNOTAVAIL');
          assert.strictEqual(error.message, `connect EADDRNOTAVAIL ::1:${port} - Local (:::0)`);
        }

        ipv4Server.close();
        dnsServer.close();
      }));
    }));
  }));
}
