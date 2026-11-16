import test from "node:test";
import assert from "node:assert/strict";

import {
  CIRCUIT_METADATA,
  decodeReleaseInputs,
  encodeReleaseInputs,
  evaluateNandReference,
  evaluatePackedReleasePolicy,
  evaluateReleasePolicy,
} from "./businessflow-release-circuit.mjs";

test("circuit metadata documents the input and output bit positions", () => {
  assert.equal(CIRCUIT_METADATA.inputBits.buyerApproved, 0);
  assert.equal(CIRCUIT_METADATA.inputBits.verifierApproved, 1);
  assert.equal(CIRCUIT_METADATA.inputBits.disputed, 2);
  assert.equal(CIRCUIT_METADATA.outputBits.releaseAllowed, 0);
});

test("release policy matches all eight possible input combinations", () => {
  const expected = [
    0, // no approvals, no dispute
    1, // buyer approval
    1, // verifier approval
    1, // both approvals
    0, // dispute blocks release
    0, // buyer approval plus dispute
    0, // verifier approval plus dispute
    0, // both approvals plus dispute
  ];

  for (let packed = 0; packed < 8; packed += 1) {
    assert.equal(
      evaluatePackedReleasePolicy(packed),
      expected[packed],
      `unexpected result for packed input ${packed}`,
    );
  }
});

test("either buyer or verifier approval permits release when not disputed", () => {
  assert.equal(
    evaluateReleasePolicy({
      buyerApproved: true,
      verifierApproved: false,
      disputed: false,
    }),
    true,
  );

  assert.equal(
    evaluateReleasePolicy({
      buyerApproved: false,
      verifierApproved: true,
      disputed: false,
    }),
    true,
  );
});

test("a dispute always blocks release", () => {
  for (const buyerApproved of [false, true]) {
    for (const verifierApproved of [false, true]) {
      assert.equal(
        evaluateReleasePolicy({
          buyerApproved,
          verifierApproved,
          disputed: true,
        }),
        false,
      );
    }
  }
});

test("input encoding and decoding round-trip for all eight combinations", () => {
  for (let packed = 0; packed < 8; packed += 1) {
    assert.equal(encodeReleaseInputs(decodeReleaseInputs(packed)), packed);
  }
});

test("NAND reference agrees with the Boolean policy", () => {
  for (let packed = 0; packed < 8; packed += 1) {
    const inputs = decodeReleaseInputs(packed);
    assert.equal(
      evaluateNandReference(inputs),
      evaluateReleasePolicy(inputs),
    );
  }
});

test("invalid Boolean inputs are rejected", () => {
  assert.throws(
    () =>
      evaluateReleasePolicy({
        buyerApproved: 1,
        verifierApproved: false,
        disputed: false,
      }),
    TypeError,
  );
});

test("invalid packed inputs are rejected", () => {
  for (const value of [-1, 8, 1.5, "1", null]) {
    assert.throws(() => decodeReleaseInputs(value), RangeError);
  }
});
