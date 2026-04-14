import { type Edge, portId, type ProcessrNode, type ProcessrNodeData, processrNodeId } from "../models";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react";
import { createEdge } from "./edge-factory.ts";

export const toRFNode = (node:ProcessrNode): RFNode<ProcessrNodeData> => {
  return {
    id: node.id,
    type: "processor",
    position: node.position,
    data: node as ProcessrNodeData,
  };
};

export const toRFEdge = (edge:Edge): RFEdge => {
  return {
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    sourceHandle: edge.sourcePortId,
    targetHandle: edge.targetPortId,
    label: edge.label,
  };
};

export const fromRFConnection = (rfEge:RFEdge): Edge => {
  if (!rfEge.sourceHandle || !rfEge.targetHandle) {
    throw new Error("Invalid RF connection");
  }
  return createEdge(
    processrNodeId(rfEge.source),
    processrNodeId(rfEge.target),
    { sourcePortId: portId(rfEge.sourceHandle), targetPortId: portId(rfEge.targetHandle) }
  );
};