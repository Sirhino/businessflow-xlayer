/**
 * BusinessFlow release-policy reference model.
 *
 * Policy:
 *   releaseAllowed = (buyerApproved OR verifierApproved) AND NOT disputed
 *
 * IMPORTANT:
 * This is a JavaScript reference model and truth-table implementation.
 * It is NOT compiled TapeOut circuit source, processor bytecode, or a
 * deployed processor. Compile using the official TapeOut toolchain and
 * verify the resulting interface before using it on X Layer Testnet.
 */

export const CIRCUIT_METADATA = Object.freeze({
  name: "BusinessFlowReleasePolicy",
  version: "0.1.0",
  inputBits: Object.freeze({
    buyerApproved: 0,
    verifierApproved: 1,
    disputed: 2,
  }),
  outputBits: Object.freeze({
    releaseAllowed: 0,
  }),
  gateModel: "NAND reference implementation",
});

function assertBoolean(value, name) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${name} must be a boolean`);
  }
}

/**
 * Evaluate the policy using the human-readable Boolean expression.
 */
export function evaluateReleasePolicy({
  buyerApproved,
  verifierApproved,
  disputed,
}) {
  assertBoolean(buyerApproved, "buyerApproved");
  assertBoolean(verifierApproved, "verifierApproved");
  assertBoolean(disputed, "disputed");

  return (buyerApproved || verifierApproved) && !disputed;
}

/**
 * Pack inputs into a uint-style integer, least-significant bit first:
 * bit 0 = buyerApproved
 * bit 1 = verifierApproved
 * bit 2 = disputed
 */
export function encodeReleaseInputs({
  buyerApproved,
  verifierApproved,
  disputed,
}) {
  assertBoolean(buyerApproved, "buyerApproved");
  assertBoolean(verifierApproved, "verifierApproved");
  assertBoolean(disputed, "disputed");

  return (
    (buyerApproved ? 1 : 0) |
    (verifierApproved ? 2 : 0) |
    (disputed ? 4 : 0)
  );
}

/**
 * Decode the three-bit input representation.
 */
export function decodeReleaseInputs(packed) {
  if (!Number.isInteger(packed) || packed < 0 || packed > 7) {
    throw new RangeError("packed input must be an integer from 0 through 7");
  }

  return {
    buyerApproved: (packed & 1) !== 0,
    verifierApproved: (packed & 2) !== 0,
    disputed: (packed & 4) !== 0,
  };
}

/**
 * Evaluate from the packed input and return a one-bit output:
 * bit 0 = releaseAllowed.
 */
export function evaluatePackedReleasePolicy(packed) {
  const inputs = decodeReleaseInputs(packed);
  return evaluateReleasePolicy(inputs) ? 1 : 0;
}

/**
 * Six-NAND reference network:
 *   approval = NAND(NAND(buyer, buyer), NAND(verifier, verifier))
 *   notDisputed = NAND(disputed, disputed)
 *   release = NAND(NAND(approval, notDisputed),
 *                  NAND(approval, notDisputed))
 *
 * This function is a logical reference only; it is not a TapeOut netlist.
 */
export function evaluateNandReference({
  buyerApproved,
  verifierApproved,
  disputed,
}) {
  assertBoolean(buyerApproved, "buyerApproved");
  assertBoolean(verifierApproved, "verifierApproved");
  assertBoolean(disputed, "disputed");

  const nand = (a, b) => !(a && b);

  const notBuyer = nand(buyerApproved, buyerApproved);
  const notVerifier = nand(verifierApproved, verifierApproved);
  const approval = nand(notBuyer, notVerifier);

  const notDisputed = nand(disputed, disputed);
  const notRelease = nand(approval, notDisputed);
  const release = nand(notRelease, notRelease);

  return release;
}
