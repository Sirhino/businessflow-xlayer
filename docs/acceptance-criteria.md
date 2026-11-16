# MVP acceptance criteria

- [ ] Buyer can create an agreement with supplier, verifier and amount.
- [ ] Only buyer can fund an agreement.
- [ ] Only supplier can submit a non-zero evidence hash after funding.
- [ ] Only buyer or designated verifier can approve after evidence submission.
- [ ] Buyer or supplier can open a dispute while funded/evidence-submitted.
- [ ] Disputed agreement cannot release funds.
- [ ] Release calls the configured TapeOut processor using the documented `eval(uint256,bytes)` ABI.
- [ ] Circuit receives stored state, not user-supplied arbitrary approval flags.
- [ ] Supplier receives escrow amount only if circuit output bit 0 is set.
- [ ] Local UI clearly labels demo mode and never represents simulated actions as on-chain transactions.
- [ ] Testnet deployment uses chain ID 1952 and verified contract addresses.
