# BusinessFlow — X Layer × TapeOut

**Programmable business agreements and conditional settlement.**

BusinessFlow is a hackathon MVP for creating supplier agreements, funding ERC-20 escrow, recording milestone approvals, and releasing funds only when an on-chain TapeOut circuit approves the release policy.

> **Current package status:** local interactive demo + Solidity contracts + mock processor/token tests + deployment scaffolding. It is not yet a live deployment. Do not use real funds. The TapeOut processor address and circuit ID must be configured from verified X Layer deployments before live circuit evaluation.

## What works in this package

- Responsive dashboard with local demo mode.
- Create and view sample agreements in browser storage.
- Demo lifecycle: fund, submit delivery, approve, dispute, evaluate, release/refund simulation.
- Wallet connection and X Layer Testnet network-switch helper (chain ID `1952`).
- Solidity escrow contract using an ERC-20 token and a TapeOut-compatible `eval(uint256,bytes)` interface.
- Unit tests for the payment policy and escrow lifecycle using mock ERC-20 and mock TapeOut processor.
- Foundry configuration and deployment script.

## What still requires configuration / live verification

1. A verified TapeOut processor contract deployed/available on X Layer Testnet.
2. A circuit ID on that processor implementing the documented 3-input policy:
   `release = (buyerApproved OR verifierApproved) AND NOT disputed`.
3. A test ERC-20 token address on X Layer Testnet. Do not assume a test USDT address; set the actual verified token address.
4. Test OKB in the deployer wallet.
5. Contract deployment, explorer verification and an end-to-end transaction test.

The TapeOut interface follows TAP-02's documented read-only `eval(uint256 id, bytes inputs) returns (bytes)` shape. Inputs are packed least-significant-bit first: bit 0 = buyer approval, bit 1 = verifier approval, bit 2 = dispute open. Output bit 0 is the release decision. The mock processor is only for tests and local development; it is not a TapeOut deployment.

## Requirements

- Node.js 20+
- Git
- Foundry (`forge`, `cast`, `anvil`) for Solidity compilation/deployment/tests
- MetaMask or another injected EVM wallet for live testnet use

## Run the local demo

From the project root:

```bash
python -m http.server 4173 --directory frontend
```

Open <http://localhost:4173>.

The dashboard defaults to **Demo mode**. Demo actions change only local browser state and do not move tokens or create blockchain transactions.

## Run JavaScript tests

```bash
npm test
```

## Compile and test Solidity

```bash
cd contracts
forge install
forge test -vv
```

The tests use local mock contracts and do not require a network or private key.

## Configure X Layer Testnet

Official network settings:

- Network: X Layer Testnet
- Chain ID: `1952` (`0x7a0`)
- Currency: OKB
- RPC: `https://testrpc.xlayer.tech/terigon`
- Explorer: <https://www.okx.com/web3/explorer/xlayer-test>

Get test OKB from the official faucet: <https://web3.okx.com/xlayer/faucet>.

Copy `.env.example` to `.env` inside `contracts/` and set:

```env
PRIVATE_KEY=YOUR_TESTNET_ONLY_PRIVATE_KEY
PAYMENT_TOKEN=VERIFIED_TEST_ERC20_ADDRESS
TAPEOUT_PROCESSOR=VERIFIED_XLAYER_TESTNET_PROCESSOR_ADDRESS
TAPEOUT_CIRCUIT_ID=1
VERIFIER=YOUR_VERIFIER_WALLET_ADDRESS
```

Never commit `.env` or share a private key/seed phrase. The deployment script refuses missing or malformed configuration. It does not deploy or assume a token or TapeOut processor.

## Deploy (only after configuring verified addresses)

```bash
cd contracts
source .env  # Git Bash users can use: set -a; source .env; set +a
forge script script/Deploy.s.sol:Deploy --rpc-url https://testrpc.xlayer.tech/terigon --broadcast
```

After deployment, copy the printed escrow address into `frontend/js/config.js` under `escrowAddress`. Set the token address there too. The front end deliberately keeps demo mode available if no deployed address is configured.

## Safety and design notes

- This is a hackathon prototype, not audited software.
- Escrow supports one ERC-20 per deployment.
- Buyer and supplier can open a dispute; only the buyer or designated verifier can approve.
- Disputes block release. This MVP does not implement arbitration or automatic dispute resolution.
- The supplier submits delivery evidence as a reference string/hash. The contract cannot independently verify physical delivery.
- The verifier is a trusted role for the MVP. Production deployment needs stronger verifier governance, clear arbitration, access control review, token allowlisting, reentrancy review, and an independent audit.
- The contract does not accept arbitrary approval booleans from callers. It reads approvals and dispute status stored on-chain, then passes those bits to the TapeOut circuit.

## Project layout

```text
frontend/              Static responsive app and local demo
contracts/src/         Escrow contract and TapeOut processor interface
contracts/test/        Foundry tests and mocks
contracts/script/      Foundry deployment script
tapeout/circuits/      Circuit policy specification and test vectors
backend/functions/     Reserved for future API/indexing work
docs/                  Architecture, threat model, and acceptance criteria
scripts/               Local smoke-test helpers
```

## Hackathon checklist

- [ ] Confirm current TapeOut processor deployment on X Layer Testnet
- [ ] Create/deploy the 3-input, 1-output policy circuit
- [ ] Record verified processor address and circuit ID
- [ ] Verify test ERC-20 address and decimals
- [ ] Deploy escrow on X Layer Testnet
- [ ] Run a live create → fund → approve → TapeOut eval → release flow
- [ ] Add live transaction links and contract addresses to the README
- [ ] Record demo video and submit before the official deadline

## License

MIT for this project package unless a third-party dependency or asset states otherwise.
