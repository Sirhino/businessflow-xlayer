# BusinessFlow Release Policy Circuit

## Purpose

This document records the release condition used by BusinessFlow. It is
intended to guide implementation and verification of a TapeOut circuit.

## Release condition

```text
releaseAllowed = (buyerApproved OR verifierApproved) AND NOT disputed
```

A release is permitted when either the buyer or the verifier has approved,
provided the agreement is not disputed. A dispute blocks release even if one
or both approvals are present.

## Packed input and output convention

The JavaScript reference model uses a three-bit input integer, least
significant bit first:

| Bit | Input |
| --- | --- |
| 0 | `buyerApproved` |
| 1 | `verifierApproved` |
| 2 | `disputed` |

The output is a one-bit value:

| Bit | Output |
| --- | --- |
| 0 | `releaseAllowed` |

Output `1` means release is allowed. Output `0` means release is blocked.

## Truth table

| Buyer approved | Verifier approved | Disputed | Release allowed |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 |
| 1 | 1 | 0 | 1 |
| 0 | 0 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 1 | 1 | 0 |

## Files in this implementation

- `scripts/businessflow-release-circuit.mjs`: executable JavaScript reference
  model, packed-input encoder/decoder, and NAND-equivalent logic.
- `scripts/businessflow-release-circuit.test.mjs`: automated tests for the
  truth table, encoding, dispute handling, and NAND reference.

Run the tests from the project root with:

```bash
node --test scripts/businessflow-release-circuit.test.mjs
```

The project's existing `npm test` script should also discover this test file
because it matches `scripts/*.test.mjs`.

## TapeOut implementation status

**This is a reference specification, not a compiled TapeOut artifact.**

The JavaScript file is not a TapeOut circuit source file, netlist, compiled
bytecode, or deployed processor. Before connecting BusinessFlow's escrow
contract to a TapeOut processor:

1. Confirm the official TapeOut circuit language, compiler, and input/output
   schema for the target environment.
2. Translate this Boolean policy into that supported circuit format.
3. Compile it with the official toolchain and retain the compiler output.
4. Verify the compiled circuit against all eight truth-table cases.
5. Confirm the processor address and interface for **X Layer Testnet**
   (chain ID `1952`) from an authoritative source.
6. Update deployment configuration only after those details are verified.

Do not substitute this JavaScript reference file for processor bytecode, and
do not invent a processor address or circuit identifier.
