// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BusinessFlowEscrow} from "../src/BusinessFlowEscrow.sol";
import {MockTapeOutProcessor} from "../src/MockTapeOutProcessor.sol";
import {MockERC20} from "../src/MockERC20.sol";

interface Vm { function prank(address) external; }

contract BusinessFlowEscrowTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address buyer = address(0xB0B);
    address supplier = address(0x5150);
    address verifier = address(0xA11CE);
    MockERC20 token;
    MockTapeOutProcessor processor;
    BusinessFlowEscrow escrow;

    function setUp() public {
        token = new MockERC20();
        processor = new MockTapeOutProcessor();
        escrow = new BusinessFlowEscrow(address(token), address(processor), 1);
        token.mint(buyer, 100e6);
        vm.prank(buyer);
        token.approve(address(escrow), type(uint256).max);
    }

    function testBuyerApprovalReleasesAfterEvidence() public {
        uint256 id = _fundAndSubmit();
        vm.prank(buyer);
        escrow.approve(id);
        escrow.release(id);
        require(token.balanceOf(supplier) == 10e6, "supplier not paid");
        (,,,, BusinessFlowEscrow.Status status,,,,,) = escrow.agreements(id);
        require(status == BusinessFlowEscrow.Status.Released, "wrong status");
    }

    function testVerifierApprovalReleasesAfterEvidence() public {
        uint256 id = _fundAndSubmit();
        vm.prank(verifier);
        escrow.approve(id);
        escrow.release(id);
        require(token.balanceOf(supplier) == 10e6, "supplier not paid");
    }

    function testDisputeBlocksRelease() public {
        uint256 id = _fundAndSubmit();
        vm.prank(buyer);
        escrow.approve(id);
        vm.prank(supplier);
        escrow.openDispute(id);
        (,,,,,,, bool disputed,,) = escrow.agreements(id);
        require(disputed, "dispute not recorded");
        // A disputed agreement cannot be released; the call must revert.
        (bool ok,) = address(escrow).call(abi.encodeCall(escrow.release, (id)));
        require(!ok, "release unexpectedly succeeded");
    }

    function testOnlyBuyerCanFund() public {
        uint256 id = escrow.createAgreement(supplier, verifier, 10e6);
        vm.prank(supplier);
        (bool ok,) = address(escrow).call(abi.encodeCall(escrow.fund, (id)));
        require(!ok, "non-buyer funded");
    }

    function _fundAndSubmit() internal returns (uint256 id) {
        vm.prank(buyer);
        id = escrow.createAgreement(supplier, verifier, 10e6);
        vm.prank(buyer);
        escrow.fund(id);
        vm.prank(supplier);
        escrow.submitEvidence(id, keccak256("delivery-proof-001"));
    }
}
