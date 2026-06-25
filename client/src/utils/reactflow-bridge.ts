import { type Edge, type ProcessrNode, type ProcessrNodeData, processrNodeId } from "../models";
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react";
import { createEdge } from "./edge-factory.ts";
import { portInstanceId } from "../models/ids.ts";
import { logger } from "./logger.ts";

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
    logger.error(`[fromRFConnection] missing handles — source=${rfEge.source} target=${rfEge.target}`);
    throw new Error("Invalid RF connection");
  }
  logger.debug(`[fromRFConnection] source=${rfEge.source}:${rfEge.sourceHandle} target=${rfEge.target}:${rfEge.targetHandle}`);
  return createEdge(
    processrNodeId(rfEge.source),
    processrNodeId(rfEge.target),
    { sourcePortId: portInstanceId(rfEge.sourceHandle), targetPortId: portInstanceId(rfEge.targetHandle) }
  );
};