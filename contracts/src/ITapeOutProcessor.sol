// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal read-only TapeOut processor interface from TAP-02.
/// @dev Confirm the target processor's deployed ABI/address on X Layer before live use.
interface ITapeOutProcessor {
    function eval(uint256 id, bytes calldata inputs) external view returns (bytes memory outputs);
}
