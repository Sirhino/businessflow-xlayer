
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReleaseNetlist,
  evaluateReleaseNetlist,
  getTruthTable
} from "./tapeout-release-netlist.mjs";

test("circuit has the expected structure", () => {
  const circuit = buildReleaseNetlist();

  assert.equal(circuit.nIn, 3);
  assert.equal(circuit.nOut, 1);
  assert.equal(circuit.gateCount, 6);
  assert.equal(circuit.netlist.length, 42);
  assert.equal(circuit.outputSignal, 10);
});

test("all eight approval combinations are correct", () => {
  const circuit = buildReleaseNetlist();
  const expected = [0, 1, 1, 1, 0, 0, 0, 0];

  for (let input = 0; input < 8; input++) {
    assert.equal(
      evaluateReleaseNetlist(circuit.netlist, input),
      expected[input],
      `Incorrect output for packed input ${input}`
    );
  }
});

test("a dispute always blocks payment", () => {
  const circuit = buildReleaseNetlist();

  for (let input = 4; input < 8; input++) {
    assert.equal(evaluateReleaseNetlist(circuit.netlist, input), 0);
  }
});

test("truth table contains eight rows", () => {
  assert.equal(getTruthTable().length, 8);
});

test("invalid packed inputs are rejected", () => {
  const circuit = buildReleaseNetlist();

  assert.throws(() => evaluateReleaseNetlist(circuit.netlist, 8));
  assert.throws(() => evaluateReleaseNetlist(circuit.netlist, -1));
});

test("unsupported opcodes are rejected", () => {
  const circuit = buildReleaseNetlist();
  const invalid = Uint8Array.from(circuit.netlist);

  invalid[0] = 0xff;

  assert.throws(() => evaluateReleaseNetlist(invalid, 0));
});
