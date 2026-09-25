import type {
  Edge, EdgeId, Graph, GraphAction, GraphChange,
  PortInstance, PortInstanceId, ProcessrNodeId, ReversibleAction
} from "../models";
import {
  addChangeToHistory,
  applyPortInstances,
  applySingleNodeUpdate, filterMap, getOrThrow,
  setNodePositions, setNodeRecipe
} from "../utils/graph-utils.ts";
import { logger } from "../utils/logger.ts";

/**
 * Takes an action and applies it to the graph. **Does not** apply the action to the history
 * @param graph
 * @param action
 */
const applyActionToGraph = (graph: Graph, action: GraphAction<ReversibleAction>): Graph => {
  const { type, payload } = action;
  switch (type) {
    case "ADD_NODE": {
      const { node, portInstances } = payload;
      return { ...graph, nodes: new Map([...graph.nodes, [node.id, node]]), portInstances: new Map([...graph.portInstances, ...portInstances]) };
    }
    case "REMOVE_NODE": {
      const { nodeId } = payload;
      const node = graph.nodes.get(nodeId);
      if (!node) {
        return graph;
      }
      return {
        ...graph,
        nodes: filterMap(graph.nodes, (k) => k !== nodeId),
        edges: filterMap(graph.edges, (_k, v) => v.sourceNodeId !== nodeId && v.targetNodeId !== nodeId),
        portInstances: filterMap(graph.portInstances, (k) => !node.ports.includes(k))
      };
    }
    case "SET_NODE_POSITIONS": {
      const { positions } = payload;
      return setNodePositions(graph, positions);
    }
    case "SET_NODE_RECIPE": {
      const { update, behavior } = payload;
      if (!graph.nodes.has(update.nodeId)) return graph;
      return setNodeRecipe(graph, update, behavior);
    }
    case "ADD_EDGE": {
      const { edge } = payload;
      return { ...graph, edges: new Map([...graph.edges, [edge.id, edge]]) };
    }
    case "REMOVE_EDGE": {
      const { edgeId } = payload;
      return { ...graph, edges: filterMap(graph.edges, (k) => k !== edgeId) };
    }
    case "SET_MULTI_NODE_RECIPES": {
      const { updates, behavior } = payload;
      return updates.reduce((graphAccumulator, currentUpdate): Graph =>
        setNodeRecipe(graphAccumulator, currentUpdate, behavior),
        graph
      );
    }
    case "STACK_NODES": {
      const { survivorId, removedIds, newCount } = payload;
      const removedSet = new Set<string>(removedIds);

      const filteredNodes = filterMap(graph.nodes, (id) => !removedSet.has(id));
      if (!filteredNodes.has(survivorId)) {
        logger.error(`[applyActionToGraph] [STACK_NODES] the surviving nodeId is invalid: ${survivorId}`);
        return graph;
      }
      const survivor = getOrThrow(filteredNodes, survivorId);
      const nodes = new Map([...filteredNodes, [survivorId, { ...survivor, count: newCount }]]);
      const removedPortIds = new Set(removedIds.filter(id => graph.nodes.has(id)).flatMap(id => getOrThrow(graph.nodes, id).ports));
      const newPortInstances = filterMap(graph.portInstances, (k) => !removedPortIds.has(k));

      const edges = graph.edges.entries().reduce((acc: ReadonlyMap<EdgeId, Edge>, [id, edge]) => {
        const srcRemoved = removedSet.has(edge.sourceNodeId);
        const tgtRemoved = removedSet.has(edge.targetNodeId);
        if (!srcRemoved && !tgtRemoved) { return new Map([...acc, [id, edge]]); }
        const rerouted = {
          ...edge,
          sourceNodeId: srcRemoved ? survivorId : edge.sourceNodeId,
          targetNodeId: tgtRemoved ? survivorId : edge.targetNodeId,
        };
        // Drop self-loops
        if (rerouted.sourceNodeId === rerouted.targetNodeId) return acc;
        // Deduplicate
        const isDup = acc.values().some(e =>
          e.sourceNodeId === rerouted.sourceNodeId &&
          e.targetNodeId === rerouted.targetNodeId &&
          e.sourcePortId === rerouted.sourcePortId &&
          e.targetPortId === rerouted.targetPortId
        );
        if (isDup) return acc;
        return new Map([...acc, [id, rerouted]]);
      }, new Map());

      return { ...graph, nodes, edges, portInstances: newPortInstances };
    }
    case "UNSTACK_NODE": {
      const { nodeId, newNodes, newPortInstances, newEdges } = payload;
      const nodes = new Map([
        ...graph.nodes,
        [nodeId, { ...getOrThrow(graph.nodes, nodeId), count: 1 }],
        ...newNodes
      ]);
      return { ...graph, nodes, edges: new Map([...graph.edges, ...newEdges]), portInstances: new Map([...graph.portInstances, ...newPortInstances]) };
    }
    case "SET_STACK_SIZE": {
      const { nodeId, newStackSize } = payload;
      return { ...graph, nodes: new Map([
        ...filterMap(graph.nodes, (k) => k!==nodeId),
          [nodeId, { ...getOrThrow(graph.nodes, nodeId), count: newStackSize }]])
      };
    }
  }
};

/**
 * Takes a change from the history and undoes the effects on the graph.
 * @param graph
 * @param change
 */
const undoAction = (graph: Graph, change: GraphChange): Graph => {
  const { type, action } = change;
  switch (type) {
    case "ADD_NODE": {
      const { node, portInstances } = action.payload;
      return { ...graph, nodes: filterMap(graph.nodes, (k) => k!==node.id), portInstances: filterMap(graph.portInstances, (k) =>  !portInstances.has(k)) };
    }
    case "REMOVE_NODE": {
      const { removedNode, removedEdges, removedPortInstances } = change.payload;

      return {
        ...graph,
        nodes: new Map([...graph.nodes, [removedNode.id, removedNode]]),
        edges: new Map([...graph.edges, ...removedEdges]),
        portInstances:  new Map([...graph.portInstances, ...removedPortInstances])
      };
    }
    case "SET_NODE_POSITIONS": {
      const { previousPositions } =change.payload;
      return setNodePositions(graph, previousPositions);
    }
    case "SET_NODE_RECIPE": {
      const { previousRecipeId, previousPorts, changedEdges } = change.payload;
      const { update } = action.payload;

      if (!graph.nodes.has(update.nodeId)) return graph;
      const restored = applyPortInstances(applySingleNodeUpdate(graph, update.nodeId, { recipeId: previousRecipeId }), previousPorts);
      return { ...restored, edges: new Map([...restored.edges, ...changedEdges]) };
    }
    case "ADD_EDGE": {
      const { edge } = action.payload;
      return { ...graph, edges: filterMap(graph.edges, (k) => k!==edge.id) };
    }
    case "REMOVE_EDGE": {
      const { removedEdge } = change.payload;
      return { ...graph, edges: new Map([...graph.edges, [removedEdge.id, removedEdge]]) };
    }
    case "SET_MULTI_NODE_RECIPES": {
      const { previousRecipes, previousPorts, changedEdges } = change.payload;
      const restoredNodes =previousRecipes.entries().reduce((graphAccumulator: Graph, [nodeId, recipeId]) => {
        if (!graphAccumulator.nodes.has(nodeId)) return graphAccumulator;
        return applyPortInstances(applySingleNodeUpdate(graphAccumulator, nodeId, { recipeId }), previousPorts.get(nodeId) ?? []);
      }, graph);
      return { ...restoredNodes, edges: new Map([...restoredNodes.edges, ...changedEdges]) };
    }
    case "STACK_NODES": {
      const { originalSurvivorCount, removedNodes, edgeSnapshot, removedPortInstances } = change.payload;
      const { survivorId } = action.payload;
      const survivor = getOrThrow(graph.nodes, survivorId);
      const nodes = new Map([
        ...graph.nodes,
        [survivorId, { ...survivor, count: originalSurvivorCount }],
        ...removedNodes,
    ]);
      return { ...graph, nodes, edges: edgeSnapshot, portInstances: new Map([...graph.portInstances, ...removedPortInstances]) };
    }
    case "UNSTACK_NODE": {
      const { newNodeIds, newEdgeIds, originalCount } = change.payload;
      const { nodeId, newPortInstances } = action.payload;
      const filteredNodes = filterMap(graph.nodes, (id) => !new Set<ProcessrNodeId>(newNodeIds).has(id));
      const survivor = getOrThrow(filteredNodes, nodeId);
      return {
        ...graph,
        nodes: new Map([...filteredNodes, [nodeId, { ...survivor, count: originalCount }]]),
        edges: filterMap(graph.edges, (id) => !newEdgeIds.includes(id)),
        portInstances: filterMap(graph.portInstances, (k) => !newPortInstances.has(k))
      };
    }
    case "SET_STACK_SIZE": return applySingleNodeUpdate(graph, action.payload.nodeId, { count: change.payload.previousStackSize });
  }
};


/**
 * Creates the appropriate GraphChange object from an action.
 * @param graph
 * @param action
 */
const createGraphChangeForHistory = (graph: Graph, action:GraphAction<ReversibleAction>):GraphChange => {
  const { type } = action;
  switch (type) {
    case "ADD_NODE": return { type, action };
    case "ADD_EDGE": return { type, action };
    case "REMOVE_NODE": {
      const { nodeId } = action.payload;
      const removedNode = getOrThrow(graph.nodes, nodeId);
      const removedEdges = filterMap(graph.edges, (_, e) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId);
      const removedPortInstances = graph.nodes.has(nodeId) ? filterMap(graph.portInstances, (k) => removedNode.ports.includes(k)) : new Map<PortInstanceId, PortInstance>();

      return { type, action, payload: { removedNode, removedEdges, removedPortInstances } };
    }
    case "SET_NODE_POSITIONS": {
      const { positions } = action.payload;
      const previousPositions = new Map(positions.keys().flatMap((id) => {
        const node = graph.nodes.get(id);
        return node ? [[id, node.position]] : [];
      }));

      return { type, action, payload: { previousPositions } };
    }
    case "SET_NODE_RECIPE": {
      const { update } = action.payload;
      const previousRecipeId = getOrThrow(graph.nodes, update.nodeId).recipeId;
      const previousPorts = getOrThrow(graph.nodes, update.nodeId).ports.flatMap(id => {
        const portInstance = graph.portInstances.get(id);
        return portInstance ? [portInstance] : [];
      });
      return { type, action, payload: { previousRecipeId, previousPorts, changedEdges: update.invalidEdges } };
    }
    case "REMOVE_EDGE": return {
      type, action, payload: { removedEdge: getOrThrow(graph.edges, action.payload.edgeId) }
    };
    case "SET_MULTI_NODE_RECIPES": {
      const previousRecipes = new Map(
        action.payload.updates.map(({ nodeId }) => [nodeId, getOrThrow(graph.nodes, nodeId).recipeId])
      );
      const previousPorts = new Map(action.payload.updates.map(
        ({ nodeId }) => [nodeId, getOrThrow(graph.nodes, nodeId).ports.map(id => getOrThrow(graph.portInstances, id))])
      );
      const changedEdges = action.payload.updates.reduce(
        (acc:ReadonlyMap<EdgeId, Edge>, u) => (new Map([...acc, ...u.invalidEdges])),
        new Map()
      );
      return { type, action, payload: { previousRecipes, previousPorts, changedEdges } };
    }
    case "STACK_NODES": {
      const { survivorId, removedIds } = action.payload;
      const removedSet = new Set(removedIds);
      const removedNodes = filterMap(graph.nodes, (k) => removedSet.has(k));
      const removedPortInstanceIds = new Set(removedNodes.values().flatMap((v) => v.ports));
      return { type, action, payload: {
        originalSurvivorCount: getOrThrow(graph.nodes, survivorId).count,
        removedNodes,
        edgeSnapshot: new Map(graph.edges),
        removedPortInstances: filterMap(graph.portInstances, (k) => removedPortInstanceIds.has(k)),
      } };
    }
    case "UNSTACK_NODE": {
      const { newNodes, newEdges, nodeId } = action.payload;
      return { type, action, payload: {
        newNodeIds: [...newNodes.keys()],
        newEdgeIds: [...newEdges.keys()],
        originalCount: getOrThrow(graph.nodes, nodeId).count,
      } };
    }
    case "SET_STACK_SIZE": {
      const { nodeId } = action.payload;

      return { type, action, payload: {
          previousStackSize: getOrThrow(graph.nodes, nodeId).count
        }
      };
    }
  }
};

/**
 * Applies an action to the graph, including history processing
 * @param graph - The state of the graph before the change
 * @param action - The action to apply to the graph
 * 
 * @return Graph - The state of the graph after the change
 */
export const graphReducer = (graph: Graph, action: GraphAction): Graph => {
  const { type } = action;
  switch (type) {
    // ReversibleActions all work the same way 
    case "ADD_NODE":
    case "REMOVE_NODE":
    case "SET_NODE_POSITIONS":
    case "SET_NODE_RECIPE":
    case "SET_MULTI_NODE_RECIPES":
    case "ADD_EDGE":
    case "REMOVE_EDGE":
    case "STACK_NODES":
    case "UNSTACK_NODE":
    case "SET_STACK_SIZE":
      return addChangeToHistory(graph, applyActionToGraph(graph, action), createGraphChangeForHistory(graph, action));

    // TransientActions
    case "SET_VIEWPORT":
      return { ...graph, viewport: action.payload.viewport };
    case "UNDO": {
      const lastChange = graph.history.past.at(-1);
      if (lastChange === undefined) return graph;
      return {
        ...undoAction(graph, lastChange),
        history: { past: graph.history.past.slice(0, -1), future: [...graph.history.future, lastChange] },
        updatedAt: new Date().toISOString(),
      };
    }
    case "REDO": {
      const lastChange = graph.history.future.at(-1);
      if (lastChange === undefined) return graph;
      return {
        ...applyActionToGraph(graph, lastChange.action),
        history: { past: [...graph.history.past, lastChange], future: graph.history.future.slice(0, -1) },
        updatedAt: new Date().toISOString(),
      };
    }
  }
};