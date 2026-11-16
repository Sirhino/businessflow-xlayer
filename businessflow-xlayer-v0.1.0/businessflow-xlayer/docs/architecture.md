# BusinessFlow architecture

## Actors
- Buyer: creates agreement, funds escrow, may approve or dispute.
- Supplier: accepts work by submitting milestone evidence and may dispute.
- Verifier: optional trusted reviewer who may approve delivery.
- TapeOut processor: evaluates the release-policy circuit.

## On-chain flow
1. Buyer creates agreement with supplier, verifier and token amount.
2. Buyer approves ERC-20 allowance and funds escrow.
3. Supplier submits a non-zero evidence hash.
4. Buyer or verifier records approval on-chain.
5. Either buyer or supplier may open a dispute. A dispute blocks release.
6. Anyone may call `release`; the contract reads stored state, packs it into TapeOut input bytes and calls `eval`.
7. If output bit 0 is true, the contract transfers the escrowed token to the supplier.

## Trust boundaries
- Physical delivery is not proven by the circuit. The evidence reference and verifier are off-chain trust inputs.
- The processor address and circuit ID are deployment configuration and must be verified.
- The MVP has no arbitrator or dispute resolution. A dispute locks funds until a future arbitration module is added.
- ERC-20 token behavior is assumed to be conventional. Fee-on-transfer/rebasing tokens are not supported.

## Planned production improvements
- Reentrancy guard and checks-effects-interactions review.
- SafeERC20 integration and exact received-amount accounting.
- Agreement expiry and arbitration/appeal state machine.
- Verifier rotation, quorum approvals or decentralized attestation.
- Token allowlist, fee model, event indexer and role-based admin.
- Independent audit and fuzz/invariant testing.
