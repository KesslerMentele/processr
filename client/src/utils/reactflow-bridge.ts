import { type Edge, portId, type ProcessrNode, type ProcessrNodeData, processrNodeId } from "../models";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react";
import { createEdge } from "./graph-factory.ts";

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
  return createEdge(
    processrNodeId(rfEge.source),
    processrNodeId(rfEge.target),
    {
      sourcePortId: rfEge.sourceHandle ? portId(rfEge.sourceHandle) : undefined,
      targetPortId: rfEge.targetHandle ? portId(rfEge.targetHandle) : undefined
    }
  );
};