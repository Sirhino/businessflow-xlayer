// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BusinessFlowEscrow} from "../src/BusinessFlowEscrow.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address token = vm.envAddress("PAYMENT_TOKEN");
        address processor = vm.envAddress("TAPEOUT_PROCESSOR");
        uint256 circuitId = vm.envUint("TAPEOUT_CIRCUIT_ID");
        require(token.code.length > 0, "PAYMENT_TOKEN has no code");
        require(processor.code.length > 0, "TAPEOUT_PROCESSOR has no code");

        vm.startBroadcast(deployerKey);
        BusinessFlowEscrow escrow = new BusinessFlowEscrow(token, processor, circuitId);
        vm.stopBroadcast();
        console2.log("BusinessFlowEscrow:", address(escrow));
        console2.log("Payment token:", token);
        console2.log("TapeOut processor:", processor);
        console2.log("TapeOut circuit ID:", circuitId);
    }
}
