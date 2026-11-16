// Public configuration only. Never put private keys or seed phrases in frontend files.
window.BUSINESSFLOW_CONFIG = {
  mode: "demo", // Change to "live" only after a verified deployment.
  chainId: 1952,
  chainName: "X Layer Testnet",
  rpcUrl: "https://testrpc.xlayer.tech/terigon",
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer-test",
  currencySymbol: "OKB",
  escrowAddress: "", // Fill after deploying BusinessFlowEscrow.
  paymentTokenAddress: "", // Verified test ERC-20 address only.
  // ABI fragment is kept here for the wallet integration layer.
  escrowAbi: [
    "function createAgreement(address supplier,address verifier,uint128 amount) returns (uint256)",
    "function fund(uint256 id)",
    "function submitEvidence(uint256 id,bytes32 evidenceHash)",
    "function approve(uint256 id)",
    "function openDispute(uint256 id)",
    "function release(uint256 id)",
    "function refundUnstarted(uint256 id)"
  ]
};
