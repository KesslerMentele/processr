import { edgeId, type EdgeId, graphId, type GraphId, processorNodeId, type ProcessorNodeId } from "../models";

function randomUUID(): string {
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b, i) =>
    i === 6 ? (b & 0x0f) | 0x40 :  // version 4
    i === 8 ? (b & 0x3f) | 0x80 :  // variant
    b
  );
  const hex = bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function newGraphId(): GraphId { return graphId(randomUUID()); }
export function newProcessorNodeId(): ProcessorNodeId { return processorNodeId(randomUUID()); }
export function newEdgeId(): EdgeId { return edgeId(randomUUID()); }