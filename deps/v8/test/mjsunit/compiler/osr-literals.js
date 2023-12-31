// Copyright 2015 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax --use-osr

function mod() {
  function f0() {
    for (var i = 0; i < 3; i = i + 1 | 0) {
      %PrepareFunctionForOptimization(f0);
      %OptimizeOsr();
    }
    return {blah: i};
  }
  %PrepareFunctionForOptimization(f0);

  function f1(a) {
    for (var i = 0; i < 3; i = i + 1 | 0) {
      %PrepareFunctionForOptimization(f1);
      %OptimizeOsr();
    }
    return {blah: i};
  }
  %PrepareFunctionForOptimization(f1);

  function f2(a,b) {
    for (var i = 0; i < 3; i = i + 1 | 0) {
      %PrepareFunctionForOptimization(f2);
      %OptimizeOsr();
    }
    return {blah: i};
  }
  %PrepareFunctionForOptimization(f2);

  function f3(a,b,c) {
    for (var i = 0; i < 3; i = i + 1 | 0) {
      %PrepareFunctionForOptimization(f3);
      %OptimizeOsr();
    }
    return {blah: i};
  }
  %PrepareFunctionForOptimization(f3);

  function f4(a,b,c,d) {
    for (var i = 0; i < 3; i = i + 1 | 0) {
      %PrepareFunctionForOptimization(f4);
      %OptimizeOsr();
    }
    return {blah: i};
  }
  %PrepareFunctionForOptimization(f4);

  function bar() {
    assertEquals(3, f0().blah);
    assertEquals(3, f1(1).blah);
    assertEquals(3, f2(1,2).blah);
    assertEquals(3, f3(1,2,3).blah);
    assertEquals(3, f4(1,2,3,4).blah);
  }
  bar();
}


mod();
mod();
mod();
