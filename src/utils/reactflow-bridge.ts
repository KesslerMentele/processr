import {type Edge, edgeId, portId, type ProcessrNode, type ProcessrNodeData, processrNodeId} from "../models";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react"

export const toRFNode = (node:ProcessrNode): RFNode<ProcessrNodeData> => {
  return {
    id: node.id,
    type: "processor",
    position: node.position,
    data: node as ProcessrNodeData,
  }
}

export const fromRFNode = (rfNode:RFNode<ProcessrNodeData>): ProcessrNode => {
  return {...rfNode.data, position: rfNode.position}
}

export const toRFEdge = (edge:Edge): RFEdge => {
  return {
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    sourceHandle: edge.sourcePortId ?? null,
    targetHandle: edge.targetPortId ?? null,
    label: edge.label,
  }
};

export const fromRFConnection = (rfEge:RFEdge): Edge => {
  const base = {
    id: edgeId(rfEge.id),
    sourceNodeId: processrNodeId(rfEge.source),
    targetNodeId: processrNodeId(rfEge.target),
    metadata: {},
  }

  return rfEge.sourceHandle && rfEge.targetHandle
    ? {...base, sourcePortId: portId(rfEge.sourceHandle), targetPortId: portId(rfEge.targetHandle)}
    : base;
}