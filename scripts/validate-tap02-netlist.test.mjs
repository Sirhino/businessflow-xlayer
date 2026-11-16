
import test from "node:test";
import assert from "node:assert/strict";

import { buildReleaseNetlist } from "./tapeout-release-netlist.mjs";
import { validateTap02Netlist } from "./validate-tap02-netlist.mjs";

test("validates the BusinessFlow release circuit", () => {
  const circuit = buildReleaseNetlist();

  const result = validateTap02Netlist(
    circuit.netlist,
    circuit.nIn,
    circuit.nOut
  );

  assert.equal(result.valid, true);
  assert.equal(result.gateCount, 6);
  assert.equal(result.totalSignals, 11);
  assert.deepEqual(result.outputSignals, [10]);
});

test("rejects invalid netlist length", () => {
  assert.throws(
    () => validateTap02Netlist(
      new Uint8Array([0, 0]),
      3,
      1
    )
  );
});

test("rejects unsupported opcodes", () => {
  const invalid = new Uint8Array(7);
  invalid[0] = 0xff;

  assert.throws(
    () => validateTap02Netlist(invalid, 3, 1)
  );
});

test("rejects forward signal references", () => {
  const invalid = new Uint8Array([
    0x00,
    0x00, 0x00, 0x09,
    0x00, 0x00, 0x02
  ]);

  assert.throws(
    () => validateTap02Netlist(invalid, 3, 1)
  );
});

test("rejects invalid output count", () => {
  const circuit = buildReleaseNetlist();

  assert.throws(
    () => validateTap02Netlist(circuit.netlist, 3, 12)
  );
});
