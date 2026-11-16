
export function validateTap02Netlist(netlist, nIn, nOut) {
  if (!(netlist instanceof Uint8Array)) {
    throw new Error("Netlist must be a Uint8Array");
  }

  if (!Number.isInteger(nIn) || nIn < 0 || nIn > 0xffffffff) {
    throw new Error("Invalid input count");
  }

  if (!Number.isInteger(nOut) || nOut < 1 || nOut > 0xffffffff) {
    throw new Error("Invalid output count");
  }

  if (netlist.length % 7 !== 0) {
    throw new Error("Netlist length must be divisible by 7");
  }

  const gateCount = netlist.length / 7;

  if (nOut > gateCount) {
    throw new Error("Outputs must reference existing gate signals");
  }

  // TAP-02 signal layout:
  // 0 = constant zero
  // 1 = constant one
  // Inputs begin at signal 2.
  let signalCount = 2 + nIn;

  for (let i = 0; i < netlist.length; i += 7) {
    const gateIndex = i / 7;

    if (netlist[i] !== 0x00) {
      throw new Error(`Unsupported NAND opcode at gate ${gateIndex}`);
    }

    const a =
      (netlist[i + 1] << 16) |
      (netlist[i + 2] << 8) |
      netlist[i + 3];

    const b =
      (netlist[i + 4] << 16) |
      (netlist[i + 5] << 8) |
      netlist[i + 6];

    if (a >= signalCount || b >= signalCount) {
      throw new Error(`Invalid signal reference at gate ${gateIndex}`);
    }

    signalCount++;
  }

  return {
    valid: true,
    gateCount,
    totalSignals: signalCount,
    outputSignals: Array.from(
      { length: nOut },
      (_, i) => signalCount - nOut + i
    )
  };
}
