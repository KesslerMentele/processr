import {
  type AtlasIndex,
  type Edge, edgeId, type EdgeId, type EdgeInvalidationBehavior,
  type Graph,
  type GraphChange, graphId, type GraphId, type NodeRecipeUpdate, PortDirection,
  type PortInstance, type Position,
  type ProcessrNode, processrNodeId,
  type ProcessrNodeId,
} from "../models";
import { getPorts } from "./node-utils.ts";
import { logger } from "./logger.ts";

export interface ConnectionQuery {
  source: ProcessrNodeId;
  target: ProcessrNodeId;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export const areItemsCompatible = (connection: Readonly<ConnectionQuery>, graph: Graph, atlasIndex: AtlasIndex): boolean => {
  const sourceNode = graph.nodes.get(connection.source);
  const targetNode = graph.nodes.get(connection.target);
  if (!sourceNode || !targetNode) {
    logger.error(`[areItemsCompatible] one or both nodes do not exist in the graph, returning false: Source: ${connection.source}, Target${connection.target}`);
    return false;
  }
  if (!sourceNode.recipeId || !targetNode.recipeId) { logger.debug('[areItemsCompatible] one or both nodes have no recipe — items compatible by default'); return true; }

  const sourceRecipe = atlasIndex.recipesById.get(sourceNode.recipeId);
  const targetRecipe = atlasIndex.recipesById.get(targetNode.recipeId);
  if (!sourceRecipe || !targetRecipe) { logger.debug('[areItemsCompatible] recipe lookup failed'); return true; }

  const srcIdx = getPorts(graph, sourceNode, PortDirection.Output).findIndex(p => p.id === connection.sourceHandle);
  const tgtIdx = getPorts(graph, targetNode, PortDirection.Input).findIndex(p => p.id === connection.targetHandle);
  const srcItem = srcIdx >= 0 ? sourceRecipe.outputs[srcIdx]?.itemId : undefined;
  const tgtItem = tgtIdx >= 0 ? targetRecipe.inputs[tgtIdx]?.itemId : undefined;
  logger.debug(`[areItemsCompatible] item check srcIdx=${String(srcIdx)} srcItem=${srcItem ?? 'none'} tgtIdx=${String(tgtIdx)} tgtItem=${tgtItem ?? 'none'}`);

  return !srcItem || !tgtItem || srcItem === tgtItem;
};


export const findInvalidEdges = (nodeId: ProcessrNodeId, graph: Graph, atlasIndex: AtlasIndex,): ReadonlyMap<EdgeId, Edge> =>
  filterMap(graph.edges, (_, v) =>
    (v.sourceNodeId === nodeId || v.targetNodeId === nodeId)
    && !areItemsCompatible(
      { source: v.sourceNodeId, target: v.targetNodeId, sourceHandle: v.sourcePortId, targetHandle: v.targetPortId },
      graph, atlasIndex
    ));



/**
 * Filters a map using a given predicate
 * @param map
 * @param predicate
 */
export const filterMap = <K, V>(map: ReadonlyMap<K, V>, predicate: (key:K, value: V) => boolean): ReadonlyMap<K, V> => {
  return new Map(
    [...map.entries()].filter(([K,V]) => predicate(K, V))
  );
};

/**
 * Looks up a key that is expected to exist. Throws instead of silently continuing with
 * `undefined`, so a broken graph invariant surfaces immediately instead of producing
 * corrupted state.
 * Do not use this for ids that may legitimately be stale.
 * @param map
 * @param key
 */
export const getOrThrow = <K, V>(map: ReadonlyMap<K, V>, key: K): V => {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`invariant violated — expected key not found: ${String(key)}`);
  }
  return value;
};

/**
 * Applies an update to a single node and returns the new state of the graph.
 * @param graph - The state of the graph prior to the change
 * @param nodeId - The node to be targeted
 * @param update - The updates to the node state.
 *
 * @return Graph - The state of the graph after the update
 */
export const applySingleNodeUpdate = (graph: Graph, nodeId: ProcessrNodeId, update: Partial<ProcessrNode>): Graph => ({
  ...graph,
  nodes: new Map([...graph.nodes, [nodeId, { ...getOrThrow(graph.nodes, nodeId), ...update }]]),
});

/**
 * Merges a set of PortInstances into the graph's `portInstances` record, keyed by id.
 * Used whenever a node's ports get new `stack`/`item` data (e.g. a recipe change)
 * without the set of port ids themselves changing.
 * @param graph
 * @param ports
 */
export const applyPortInstances = (graph: Graph, ports: readonly PortInstance[]): Graph => ({
  ...graph,
  portInstances: new Map([...graph.portInstances, ...ports.map(p => [p.id, p] as const)]),
});

/**
 * Adds a given GraphChange to the history of the graph.
 * @param graph
 * @param nextGraph
 * @param change
 */
export const addChangeToHistory = (graph: Graph, nextGraph: Graph, change: GraphChange): Graph => ({
  ...nextGraph,
  history: { past: [...graph.history.past, change], future: [] },
  updatedAt: new Date().toISOString(),
});

export const setNodeRecipe = (graph: Graph, update: Readonly<NodeRecipeUpdate>, behavior: EdgeInvalidationBehavior): Graph => {
  const graphWithNewRecipe = applyPortInstances(applySingleNodeUpdate(graph, update.nodeId, { recipeId: update.recipeId }), update.ports);
  switch (behavior) {
    case "delete":
      return { ...graphWithNewRecipe, edges: new Map(filterMap(graphWithNewRecipe.edges, (k) => !update.invalidEdges.has(k))) };
    case "highlight":
      return {
        ...graphWithNewRecipe,
        edges: new Map(
          graphWithNewRecipe.edges.entries().map(([id, edge]) => {
            if (edge.sourceNodeId !== update.nodeId && edge.targetNodeId !== update.nodeId) return [id, edge];
            return [id, update.invalidEdges.has(id) ? { ...edge, invalid: true } : { ...edge, invalid: undefined }];
          }))
      };

  }
};

export const setNodePositions = (graph: Graph, newPositions: ReadonlyMap<ProcessrNodeId, Position>):Graph => {
  const nodesToChange = filterMap(graph.nodes, (k) => newPositions.has(k));
  const updates = new Map(nodesToChange.entries()
  .map(([k, v]): [ProcessrNodeId, ProcessrNode] => ([k, { ...v, position: newPositions.get(k) ?? v.position } as ProcessrNode])));
  return { ...graph, nodes: new Map([...graph.nodes, ...updates]) };
};

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
export function newProcessrNodeId(): ProcessrNodeId { return processrNodeId(randomUUID()); }
export function newEdgeId(): EdgeId { return edgeId(randomUUID()); }