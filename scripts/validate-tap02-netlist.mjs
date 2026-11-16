
export function validateTap02Netlist(netlist, nIn, nOut) {
  if (!(netlist instanceof Uint8Array)) {
    throw new Error("Netlist must be a Uint8Array");
  }

  if (!Number.isInteger(nIn) || nIn < 0) {
    throw new Error("Invalid input count");
  }

  if (!Number.isInteger(nOut) || nOut < 1) {
    throw new Error("Invalid output count");
  }

  if (netlist.length % 7 !== 0) {
    throw new Error("Netlist length must be divisible by 7");
  }

  // Signals 0 and 1 are constants.
  // Input signals begin at index 2.
  let signalCount = 2 + nIn;
  const gateCount = netlist.length / 7;

  for (let i = 0; i < netlist.length; i += 7) {
    if (netlist[i] !== 0x00) {
      throw new Error(`Unsupported opcode at byte ${i}`);
    }

    const a =
      (netlist[i + 1] << 16) |
      (netlist[i + 2] << 8) |
      netlist[i + 3];

    const b =
      (netlist[i + 4] << 16) |
      (netlist[i + 5] << 8) |
      netlist[i + 6];

    // Both references must point to existing signals.
    // This also prevents forward references.
    if (a >= signalCount || b >= signalCount) {
      throw new Error(`Invalid signal reference in gate ${i / 7}`);
    }

    signalCount++;
  }

  if (nOut > signalCount) {
    throw new Error("Output count exceeds available signals");
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
