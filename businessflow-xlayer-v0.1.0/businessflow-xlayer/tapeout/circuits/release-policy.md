# BusinessFlow release-policy circuit

## Required logic

Three one-bit inputs and one one-bit output:

| Input | Bit position | Meaning |
|---|---:|---|
| `buyerApproved` | 0 | Buyer has approved the submitted milestone |
| `verifierApproved` | 1 | Designated verifier has approved the submitted milestone |
| `disputed` | 2 | Either party has opened a dispute |
| `releaseAllowed` | output bit 0 | Payment may be released |

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

TAP-02 packs bit vectors least-significant-bit first. The Solidity escrow sends one byte where bit 0 is buyer approval, bit 1 is verifier approval and bit 2 is dispute state. It reads output bit 0.

**Deployment caveat:** this file specifies the intended logic, not a deployed TapeOut circuit. The project must create/tape out the actual netlist using the current TapeOut tooling, then configure the real processor contract address and circuit ID. A local mock is included only for tests.
