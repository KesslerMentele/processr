import type {
  AtlasIndex,
  Edge,
  Graph,
  GraphChange,
  ProcessrNode,
  ProcessrNodeId,
} from "../models";
import { getInputPorts, getOutputPorts } from "./node-utils.ts";
import { logger } from "./logger.ts";

export interface ConnectionQuery {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export const areItemsCompatible = (connection: Readonly<ConnectionQuery>, graph: Graph, atlasIndex: AtlasIndex): boolean => {
  const sourceNode = graph.nodes[connection.source];
  const targetNode = graph.nodes[connection.target];
  if (!sourceNode.recipeId || !targetNode.recipeId) { logger.debug('[areItemsCompatible] one or both nodes have no recipe — items compatible by default'); return true; }

  const sourceRecipe = atlasIndex.recipesById.get(sourceNode.recipeId);
  const targetRecipe = atlasIndex.recipesById.get(targetNode.recipeId);
  if (!sourceRecipe || !targetRecipe) { logger.debug('[areItemsCompatible] recipe lookup failed'); return true; }

  const srcIdx = getOutputPorts(atlasIndex.nodeTemplatesById.get(sourceNode.templateId)).findIndex(p => p.id === connection.sourceHandle);
  const tgtIdx = getInputPorts(atlasIndex.nodeTemplatesById.get(targetNode.templateId)).findIndex(p => p.id === connection.targetHandle);
  const srcItem = srcIdx >= 0 ? sourceRecipe.outputs[srcIdx]?.itemId : undefined;
  const tgtItem = tgtIdx >= 0 ? targetRecipe.inputs[tgtIdx]?.itemId : undefined;
  logger.debug(`[areItemsCompatible] item check srcIdx=${String(srcIdx)} srcItem=${srcItem ?? 'none'} tgtIdx=${String(tgtIdx)} tgtItem=${tgtItem ?? 'none'}`);

  return !srcItem || !tgtItem || srcItem === tgtItem;
};


export const findInvalidEdges = (nodeId: ProcessrNodeId, graph: Graph, atlasIndex: AtlasIndex,): Record<string, Edge> => Object.fromEntries(
  Object.values(graph.edges)
    .filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId)
    .filter(e => !areItemsCompatible(
      { source: e.sourceNodeId, target: e.targetNodeId, sourceHandle: e.sourcePortId, targetHandle: e.targetPortId },
      graph, atlasIndex
    ))
    .map(e => [e.id, e])
);

export const now = () => new Date().toISOString();

/**
 * Filters a record by removing a given key.
 * @param obj
 * @param key
 */
export const omitKey = <T>(obj: Readonly<Record<string, T>>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(obj).filter(([id]) => id !== key));


/**
 * Applies an update to a single node and returns the new state of the graph.
 * @param graph - The state of the graph prior to the change
 * @param nodeId - The node to be targeted
 * @param update - The updates to the node state.
 *
 * @return Graph - The state of the graph after the update
 */
export const applySingleNodeUpdate = (graph: Graph, nodeId: string, update: Partial<ProcessrNode>): Graph => ({
  ...graph,
  nodes: { ...graph.nodes, [nodeId]: { ...graph.nodes[nodeId], ...update } },
});

/**
 * Returns a Record of edges that are related to a given nodeId.
 * @param edges
 * @param nodeId
 */
export const pickNodeEdges = (edges: Readonly<Record<string, Edge>>, nodeId: string): Record<string, Edge> =>
  Object.fromEntries(Object.entries(edges).filter(([, e]) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId));

/**
 * Returns all edges that are not related to a given nodeId.
 * @param edges
 * @param nodeId
 */
export const omitNodeEdges = (edges: Readonly<Record<string, Edge>>, nodeId: string): Record<string, Edge> =>
  Object.fromEntries(Object.entries(edges).filter(([, e]) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));

/**
 * Adds a given GraphChange to the history of the graph.
 * @param graph
 * @param nextGraph
 * @param change
 */
export const addChangeToHistory = (graph: Graph, nextGraph: Graph, change: GraphChange): Graph => ({
  ...nextGraph,
  history: { past: [...graph.history.past, change], future: [] },
  updatedAt: now(),
});
