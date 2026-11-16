# MVP threat model

| Threat | Current mitigation | Remaining risk |
|---|---|---|
| Unauthorized funding | Only buyer can fund | Token approval UX still needs review |
| Fake approval by supplier | Only buyer/verifier can approve | Verifier is trusted |
| Release despite dispute | Stored dispute bit blocks release and circuit also checks it | Processor/circuit configuration must be verified |
| Caller supplies fake approval inputs | Contract derives circuit inputs from stored state | Circuit ABI/bit packing must be tested against deployed processor |
| Reentrancy via token | Status updated before token transfer | Add audited reentrancy guard and SafeERC20 before production |
| False delivery claim | Evidence hash logged | Hash does not prove physical delivery |
| Dispute locks funds forever | Explicitly documented MVP limitation | Arbitration and timeout path required |

Do not use this MVP for real funds. It has not been audited.
