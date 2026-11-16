// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITapeOutProcessor} from "./ITapeOutProcessor.sol";

interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

/// @title BusinessFlowEscrow
/// @notice Single-token milestone escrow whose release decision is evaluated by a TapeOut circuit.
/// @dev Prototype only. Not audited. Use only with test tokens and a verified processor/circuit.
contract BusinessFlowEscrow {
    enum Status { None, Funded, EvidenceSubmitted, Released, Refunded }

    struct Agreement {
        address buyer;
        address supplier;
        address verifier;
        uint128 amount;
        Status status;
        bool buyerApproved;
        bool verifierApproved;
        bool disputed;
        bytes32 evidenceHash;
        uint64 createdAt;
    }

    IERC20Minimal public immutable paymentToken;
    ITapeOutProcessor public immutable tapeOutProcessor;
    uint256 public immutable circuitId;
    uint256 public nextAgreementId = 1;

    mapping(uint256 => Agreement) public agreements;

    event AgreementCreated(uint256 indexed agreementId, address indexed buyer, address indexed supplier, uint256 amount, address verifier);
    event AgreementFunded(uint256 indexed agreementId, uint256 amount);
    event EvidenceSubmitted(uint256 indexed agreementId, bytes32 evidenceHash);
    event ApprovalRecorded(uint256 indexed agreementId, address indexed approver, bool isVerifier);
    event DisputeOpened(uint256 indexed agreementId, address indexed opener);
    event FundsReleased(uint256 indexed agreementId, address indexed supplier, uint256 amount, bytes circuitOutput);
    event FundsRefunded(uint256 indexed agreementId, address indexed buyer, uint256 amount);

    error InvalidAddress();
    error InvalidAmount();
    error NotAuthorized();
    error InvalidStatus();
    error Disputed();
    error TapeOutRejected();
    error TokenTransferFailed();
    error InvalidCircuitOutput();

    constructor(address token_, address processor_, uint256 circuitId_) {
        if (token_ == address(0) || processor_ == address(0)) revert InvalidAddress();
        paymentToken = IERC20Minimal(token_);
        tapeOutProcessor = ITapeOutProcessor(processor_);
        circuitId = circuitId_;
    }

    function createAgreement(address supplier, address verifier, uint128 amount) external returns (uint256 id) {
        if (supplier == address(0) || verifier == address(0) || supplier == msg.sender || verifier == msg.sender) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        id = nextAgreementId++;
        agreements[id] = Agreement({
            buyer: msg.sender,
            supplier: supplier,
            verifier: verifier,
            amount: amount,
            status: Status.None,
            buyerApproved: false,
            verifierApproved: false,
            disputed: false,
            evidenceHash: bytes32(0),
            createdAt: uint64(block.timestamp)
        });
        emit AgreementCreated(id, msg.sender, supplier, amount, verifier);
    }

    function fund(uint256 id) external {
        Agreement storage a = agreements[id];
        if (a.buyer == address(0) || msg.sender != a.buyer) revert NotAuthorized();
        if (a.status != Status.None) revert InvalidStatus();
        if (!paymentToken.transferFrom(msg.sender, address(this), a.amount)) revert TokenTransferFailed();
        a.status = Status.Funded;
        emit AgreementFunded(id, a.amount);
    }

    function submitEvidence(uint256 id, bytes32 evidenceHash) external {
        Agreement storage a = agreements[id];
        if (msg.sender != a.supplier) revert NotAuthorized();
        if (a.status != Status.Funded || evidenceHash == bytes32(0)) revert InvalidStatus();
        a.evidenceHash = evidenceHash;
        a.status = Status.EvidenceSubmitted;
        emit EvidenceSubmitted(id, evidenceHash);
    }

    function approve(uint256 id) external {
        Agreement storage a = agreements[id];
        if (a.status != Status.EvidenceSubmitted) revert InvalidStatus();
        if (a.disputed) revert Disputed();
        if (msg.sender == a.buyer) {
            a.buyerApproved = true;
            emit ApprovalRecorded(id, msg.sender, false);
        } else if (msg.sender == a.verifier) {
            a.verifierApproved = true;
            emit ApprovalRecorded(id, msg.sender, true);
        } else {
            revert NotAuthorized();
        }
    }

    function openDispute(uint256 id) external {
        Agreement storage a = agreements[id];
        if (msg.sender != a.buyer && msg.sender != a.supplier) revert NotAuthorized();
        if (a.status != Status.Funded && a.status != Status.EvidenceSubmitted) revert InvalidStatus();
        a.disputed = true;
        emit DisputeOpened(id, msg.sender);
    }

    /// @notice Evaluate stored approval/dispute state using the configured TapeOut circuit.
    /// Input bits (LSB first): bit0 buyerApproved, bit1 verifierApproved, bit2 disputed.
    /// Circuit output bit0 must equal (buyerApproved OR verifierApproved) AND NOT disputed.
    function release(uint256 id) external {
        Agreement storage a = agreements[id];
        if (a.status != Status.EvidenceSubmitted) revert InvalidStatus();
        if (a.disputed) revert Disputed();

        uint8 packed = (a.buyerApproved ? 1 : 0)
            | (a.verifierApproved ? 2 : 0)
            | (a.disputed ? 4 : 0);
        bytes memory output = tapeOutProcessor.eval(circuitId, abi.encodePacked(packed));
        if (output.length == 0) revert InvalidCircuitOutput();
        if ((uint8(output[0]) & 1) != 1) revert TapeOutRejected();

        a.status = Status.Released;
        if (!paymentToken.transfer(a.supplier, a.amount)) revert TokenTransferFailed();
        emit FundsReleased(id, a.supplier, a.amount, output);
    }

    /// @notice Refund only before approval and only when a dispute has not been opened.
    /// @dev MVP cancellation rule: buyer can cancel a funded agreement only before evidence is submitted.
    function refundUnstarted(uint256 id) external {
        Agreement storage a = agreements[id];
        if (msg.sender != a.buyer) revert NotAuthorized();
        if (a.status != Status.Funded || a.disputed) revert InvalidStatus();
        a.status = Status.Refunded;
        if (!paymentToken.transfer(a.buyer, a.amount)) revert TokenTransferFailed();
        emit FundsRefunded(id, a.buyer, a.amount);
    }
}
