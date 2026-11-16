// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test-only stand-in for a TapeOut processor. Never deploy this as the production processor.
contract MockTapeOutProcessor {
    function eval(uint256, bytes calldata inputs) external pure returns (bytes memory outputs) {
        uint8 bits = inputs.length == 0 ? 0 : uint8(inputs[0]);
        bool buyerApproved = (bits & 1) != 0;
        bool verifierApproved = (bits & 2) != 0;
        bool disputed = (bits & 4) != 0;
        bool releaseAllowed = (buyerApproved || verifierApproved) && !disputed;
        return abi.encodePacked(uint8(releaseAllowed ? 1 : 0));
    }
}
