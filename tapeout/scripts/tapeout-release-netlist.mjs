
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

function u24(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffff) {
    throw new Error(`Invalid signal index: ${value}`);
  }

  return [
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff
  ];
}

export function buildReleaseNetlist() {
  const bytes = [];
  let nextSignal = 5;

  function nand(a, b) {
    bytes.push(0x00, ...u24(a), ...u24(b));
    return nextSignal++;
  }

  // Input signals:
  // 2 = buyerApproved
  // 3 = verifierApproved
  // 4 = disputed

  const buyerNot = nand(2, 2);
  const verifierNot = nand(3, 3);
  const eitherApproved = nand(buyerNot, verifierNot);

  const disputeNot = nand(4, 4);

  const releaseNot = nand(eitherApproved, disputeNot);
  const releaseAllowed = nand(releaseNot, releaseNot);

  return {
    nIn: 3,
    nOut: 1,
    gateCount: 6,
    outputSignal: releaseAllowed,
    netlist: Uint8Array.from(bytes)
  };
}

export function evaluateReleaseNetlist(netlist, packedInput) {
  if (!Number.isInteger(packedInput) || packedInput < 0 || packedInput > 7) {
    throw new Error("Packed input must be an integer from 0 to 7");
  }

  const signals = [
    0,
    1,
    packedInput & 1,
    (packedInput >> 1) & 1,
    (packedInput >> 2) & 1
  ];

  if (netlist.length % 7 !== 0) {
    throw new Error("Invalid NAND netlist length");
  }

  for (let i = 0; i < netlist.length; i += 7) {
    if (netlist[i] !== 0x00) {
      throw new Error("Unsupported netlist opcode");
    }

    const a = (netlist[i + 1] << 16) |
              (netlist[i + 2] << 8) |
              netlist[i + 3];

    const b = (netlist[i + 4] << 16) |
              (netlist[i + 5] << 8) |
              netlist[i + 6];

    if (a >= signals.length || b >= signals.length) {
      throw new Error("Invalid forward signal reference");
    }

    signals.push(1 - (signals[a] & signals[b]));
  }

  return signals[signals.length - 1];
}

export function getTruthTable() {
  const { netlist } = buildReleaseNetlist();

  return Array.from({ length: 8 }, (_, input) => ({
    packedInput: input,
    buyerApproved: input & 1,
    verifierApproved: (input >> 1) & 1,
    disputed: (input >> 2) & 1,
    releaseAllowed: evaluateReleaseNetlist(netlist, input)
  }));
}

if (process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const circuit = buildReleaseNetlist();

  const hex = Buffer.from(circuit.netlist).toString("hex");
  const hash = createHash("sha256")
    .update(circuit.netlist)
    .digest("hex");

  console.log("BUSINESSFLOW TAP-02 RELEASE CIRCUIT");
  console.log("-----------------------------------");
  console.log("Inputs:", circuit.nIn);
  console.log("Outputs:", circuit.nOut);
  console.log("NAND gates:", circuit.gateCount);
  console.log("Output signal:", circuit.outputSignal);
  console.log("Netlist bytes:", circuit.netlist.length);
  console.log("Netlist hex:", hex);
  console.log("SHA-256:", hash);
  console.log("\nTRUTH TABLE");
  console.table(getTruthTable());
}
