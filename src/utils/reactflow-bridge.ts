import {type Edge, edgeId, portId, type ProcessorNode, type ProcessorNodeData, processorNodeId} from "../models";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react"

export const toRFNode = (node:ProcessorNode): RFNode<ProcessorNodeData> => {
  return {
    id: node.id,
    type: "processor",
    position: node.position,
    data: node as ProcessorNodeData,
  }
}

export const fromRFNode = (rfNode:RFNode<ProcessorNodeData>): ProcessorNode => {
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
    sourceNodeId: processorNodeId(rfEge.source),
    targetNodeId: processorNodeId(rfEge.target),
    metadata: {},
  }

  return rfEge.sourceHandle && rfEge.targetHandle
    ? {...base, sourcePortId: portId(rfEge.sourceHandle), targetPortId: portId(rfEge.targetHandle)}
    : base;
}