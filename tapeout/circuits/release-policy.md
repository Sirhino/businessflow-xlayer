# BusinessFlow release-policy circuit

## Purpose

BusinessFlow uses a release-policy circuit to determine whether a funded business milestone is eligible for payment release.

The policy allows release when either the buyer or designated verifier approves the submitted milestone, provided no dispute is active.

## Required logic

Three one-bit inputs and one one-bit output:

| Input | Bit position | Meaning |
|---|---:|---|
| `buyerApproved` | 0 | Buyer has approved the submitted milestone |
| `verifierApproved` | 1 | Designated verifier has approved the submitted milestone |
| `disputed` | 2 | Either party has opened a dispute |
| `releaseAllowed` | Output bit 0 | Payment may be released |

Boolean expression:

```text
releaseAllowed = (buyerApproved OR verifierApproved) AND NOT disputed
```

## Truth table

| buyer | verifier | disputed | output |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 |
| 1 | 1 | 0 | 1 |
| 0 | 0 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 1 | 1 | 0 |

## TAP-02 input and output encoding

TAP-02 packs bit vectors least-significant-bit first.

The BusinessFlow escrow encodes the input into one byte:

- Bit 0: buyer approval
- Bit 1: verifier approval
- Bit 2: dispute state

The circuit returns one output bit:

- Bit 0: release permission

## Generated netlist artifact

A local TAP-02 NAND netlist has been generated and saved at:

`tapeout/artifacts/businessflow-release-netlist.json`

Artifact details:

| Property | Value |
|---|---|
| Circuit | `BusinessFlowReleasePolicy` |
| Version | `0.1.0` |
| Format | TAP-02 NAND netlist |
| Inputs | 3 |
| Outputs | 1 |
| NAND gates | 6 |
| Output signal | 10 |
| Truth-table cases | 8 |
| Local validation | Passed |

Netlist SHA-256:

`20967280c0c34ed544c431ad82a2b46a62b056aba47eeee981082b163c7fb3ed`

The artifact preserves the generated netlist bytes, metadata, checksum and truth table.

## Local validation

The generated netlist passed the project's local TAP-02 validator. Its six NAND gates were evaluated against all eight possible input combinations, producing the expected release-policy outputs.

This confirms the generated artifact's local structural validity and expected logic.

## Integration status and deployment caveat

**Current status: locally generated and validated; not yet taped out.**

The artifact is not evidence of an on-chain TapeOut deployment or execution.

The Solidity escrow integration currently uses a local mock processor for testing. Production integration requires a compatible TapeOut processor, a successfully registered circuit ID, and verified deployment configuration.

The escrow must not be presented as using a live TapeOut circuit until those requirements have been completed and verified.
