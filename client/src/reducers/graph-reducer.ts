import type {
  Edge, Graph, GraphAction, GraphChange, ReversibleAction
} from "../models";
import {
  addChangeToHistory,
  applySingleNodeUpdate, now,
  omitKey,
  omitNodeEdges,
  pickNodeEdges
} from "../utils/graph-utils.ts";

/**
 * Takes an action and applies it to the graph. **Does not** apply the action to the history
 * @param graph
 * @param action
 */
const applyActionToGraph = (graph: Graph, action: GraphAction<ReversibleAction>): Graph => {
  const { type, payload } = action;
  switch (type) {
    case "ADD_NODE": {
      const { node } = payload;
      return { ...graph, nodes: { ...graph.nodes, [node.id]: node } };
    }
    case "REMOVE_NODE": {
      const { nodeId } = payload;
      return {
        ...graph,
        nodes: omitKey(graph.nodes, nodeId),
        edges: omitNodeEdges(graph.edges, nodeId),
      };
    }
    case "SET_NODE_POSITIONS": {
      const { positions } = payload;
      const updates = Object.fromEntries(
        Object.entries(positions)
          .filter(([id]) => Object.hasOwn(graph.nodes, id))
          .map(([id, position]) => [id, { ...graph.nodes[id], position }])
      );
      return { ...graph, nodes: { ...graph.nodes, ...updates } };
    }
    case "SET_NODE_RECIPE": {
      const { nodeId, recipeId, invalidEdges, behavior } = payload;

      if (!Object.hasOwn(graph.nodes, nodeId)) return graph;
      const graphWithNewRecipe = applySingleNodeUpdate(graph, nodeId, { recipeId: recipeId });

      // if the behavior is 'delete', remove all edges that are invalid
      if (behavior === 'delete') {
        return { ...graphWithNewRecipe, edges: Object.fromEntries(Object.entries(graphWithNewRecipe.edges).filter(([id]) => !Object.hasOwn(invalidEdges, id))) };
      }

      // else the behavior is highlight, so mark connected edges as invalid/valid based on recipe compatibility
      return { ...graphWithNewRecipe, edges: Object.fromEntries(Object.entries(graphWithNewRecipe.edges).map(([id, edge]) => {
        if (edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId) return [id, edge];
        return [id, Object.hasOwn(invalidEdges, id) ? { ...edge, invalid: true } : { ...edge, invalid: undefined }];
      })) };
    }
    case "ADD_EDGE": {
      const { edge } = payload;
      return { ...graph, edges: { ...graph.edges, [edge.id]: edge } };
    }
    case "REMOVE_EDGE": {
      const { edgeId } = payload;
      return { ...graph, edges: omitKey(graph.edges, edgeId) };
    }
    case "SET_MULTI_NODE_RECIPES": {
      const { updates, behavior } = payload;
      return updates.reduce((g, { nodeId, recipeId, invalidEdges }) => {
        if (!Object.hasOwn(g.nodes, nodeId)) return g;
        const withRecipe = applySingleNodeUpdate(g, nodeId, { recipeId });
        if (behavior === 'delete') {
          return { ...withRecipe, edges: Object.fromEntries(Object.entries(withRecipe.edges).filter(([id]) => !Object.hasOwn(invalidEdges, id))) };
        }
        return { ...withRecipe, edges: Object.fromEntries(Object.entries(withRecipe.edges).map(([id, edge]) => {
          if (edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId) return [id, edge];
          return [id, Object.hasOwn(invalidEdges, id) ? { ...edge, invalid: true } : { ...edge, invalid: undefined }];
        })) };
      }, graph);
    }
    case "STACK_NODES": {
      const { survivorId, removedIds, newCount } = payload;
      const removedSet = new Set<string>(removedIds);

      const filteredNodes = Object.fromEntries(Object.entries(graph.nodes).filter(([id]) => !removedSet.has(id)));
      const nodes = { ...filteredNodes, [survivorId]: { ...filteredNodes[survivorId], count: newCount } };

      const edges = Object.entries(graph.edges).reduce<Record<string, typeof graph.edges[string]>>((acc, [id, edge]) => {
        const srcRemoved = removedSet.has(edge.sourceNodeId);
        const tgtRemoved = removedSet.has(edge.targetNodeId);
        if (!srcRemoved && !tgtRemoved) { return { ...acc, [id]: edge }; }
        const rerouted = {
          ...edge,
          sourceNodeId: srcRemoved ? survivorId : edge.sourceNodeId,
          targetNodeId: tgtRemoved ? survivorId : edge.targetNodeId,
        };
        // Drop self-loops
        if (rerouted.sourceNodeId === rerouted.targetNodeId) return acc;
        // Deduplicate
        const isDup = Object.values(acc).some(e =>
          e.sourceNodeId === rerouted.sourceNodeId &&
          e.targetNodeId === rerouted.targetNodeId &&
          e.sourcePortId === rerouted.sourcePortId &&
          e.targetPortId === rerouted.targetPortId
        );
        if (isDup) return acc;
        return { ...acc, [id]: rerouted };
      }, {});

      return { ...graph, nodes, edges };
    }
    case "UNSTACK_NODE": {
      const { nodeId, newNodes, newEdges } = payload;
      const nodes = {
        ...graph.nodes,
        [nodeId]: { ...graph.nodes[nodeId], count: 1 },
        ...Object.fromEntries(newNodes.map(n => [n.id, n])),
      };
      return { ...graph, nodes, edges: { ...graph.edges, ...newEdges } };
    }
    case "SET_STACK_SIZE": {
      const { nodeId, newStackSize } = payload;
      return { ...graph, nodes: { ...omitKey(graph.nodes, nodeId), [nodeId]:{ ...graph.nodes[nodeId], count: newStackSize } } };
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
    case "ADD_NODE": return { ...graph, nodes: omitKey(graph.nodes, action.payload.node.id) };
    case "REMOVE_NODE": {
      const { removedNode, removedEdges } = change.payload;

      return {
        ...graph,
        nodes: { ...graph.nodes, [removedNode.id]: removedNode },
        edges: { ...graph.edges, ...removedEdges },
      };
    }
    case "SET_NODE_POSITIONS": {
      const { previousPositions } =change.payload;

      const restores = Object.fromEntries(
        Object.entries(previousPositions)
          .filter(([id]) => Object.hasOwn(graph.nodes, id))
          .map(([id, position]) => [id, { ...graph.nodes[id], position }])
      );

      return { ...graph, nodes: { ...graph.nodes, ...restores } };
    }
    case "SET_NODE_RECIPE": {
      const { previousRecipeId, changedEdges } = change.payload;
      const { nodeId } = action.payload;

      if (!Object.hasOwn(graph.nodes, nodeId)) return graph;
      const restored = applySingleNodeUpdate(graph, nodeId, { recipeId: previousRecipeId });

      return { ...restored, edges: { ...restored.edges, ...changedEdges } };

    }
    case "ADD_EDGE": {
      const { edge } = action.payload;

      return { ...graph, edges: omitKey(graph.edges, edge.id) };
    }
    case "REMOVE_EDGE": {
      const { removedEdge } = change.payload;

      return { ...graph, edges: { ...graph.edges, [removedEdge.id]: removedEdge } };
    }
    case "SET_MULTI_NODE_RECIPES": {
      const { previousRecipes, changedEdges } = change.payload;
      const restoredNodes = Object.entries(previousRecipes).reduce((g, [nodeId, recipeId]) => {
        if (!Object.hasOwn(g.nodes, nodeId)) return g;
        return applySingleNodeUpdate(g, nodeId, { recipeId });
      }, graph);
      return { ...restoredNodes, edges: { ...restoredNodes.edges, ...changedEdges } };
    }
    case "STACK_NODES": {
      const { originalSurvivorCount, removedNodes, edgeSnapshot } = change.payload;
      const { survivorId } = action.payload;
      const nodes = {
        ...graph.nodes,
        [survivorId]: { ...graph.nodes[survivorId], count: originalSurvivorCount },
        ...Object.fromEntries(removedNodes.map(n => [n.id, n])),
      };
      return { ...graph, nodes, edges: edgeSnapshot };
    }
    case "UNSTACK_NODE": {
      const { newNodeIds, newEdgeIds, originalCount } = change.payload;
      const { nodeId } = action.payload;
      const excludeSet = new Set<string>(newNodeIds);
      const filteredNodes = Object.fromEntries(
        Object.entries(graph.nodes).filter(([id]) => !excludeSet.has(id))
      );
      const nodes = { ...filteredNodes, [nodeId]: { ...filteredNodes[nodeId], count: originalCount } };
      const edges = Object.fromEntries(
        Object.entries(graph.edges).filter(([id]) => !newEdgeIds.includes(id))
      );
      return { ...graph, nodes, edges };
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
      const removedNode = graph.nodes[nodeId];
      const removedEdges = pickNodeEdges(graph.edges, nodeId);

      return { type, action, payload: { removedNode, removedEdges } };
    }
    case "SET_NODE_POSITIONS": {
      const { positions } = action.payload;

      const previousPositions = Object.fromEntries(
        Object.entries(positions)
        .filter(([id]) => Object.hasOwn(graph.nodes, id))
        .map(([id]) => [id, graph.nodes[id].position])
      );

      return { type, action, payload: { previousPositions } };
    }
    case "SET_NODE_RECIPE": {
      const { nodeId, invalidEdges } = action.payload;
      const previousRecipeId = graph.nodes[nodeId].recipeId ?? null;


      return { type, action, payload: { previousRecipeId, changedEdges: invalidEdges } };


    }
    case "REMOVE_EDGE": return {
      type, action, payload: { removedEdge: graph.edges[action.payload.edgeId] }
    };
    case "SET_MULTI_NODE_RECIPES": {
      const previousRecipes = Object.fromEntries(
        action.payload.updates.map(({ nodeId }) => [nodeId, graph.nodes[nodeId].recipeId])
      );
      const changedEdges = action.payload.updates.reduce<Record<string, Edge>>((acc, u) => ({ ...acc, ...u.invalidEdges }), {});
      return { type, action, payload: { previousRecipes, changedEdges } };
    }
    case "STACK_NODES": {
      const { survivorId, removedIds } = action.payload;
      return { type, action, payload: {
        originalSurvivorCount: graph.nodes[survivorId].count,
        removedNodes: removedIds.map(id => graph.nodes[id]).filter(Boolean),
        edgeSnapshot: { ...graph.edges },
      } };
    }
    case "UNSTACK_NODE": {
      const { newNodes, newEdges, nodeId } = action.payload;
      return { type, action, payload: {
        newNodeIds: newNodes.map(n => n.id),
        newEdgeIds: Object.keys(newEdges),
        originalCount: graph.nodes[nodeId].count,
      } };
    }
    case "SET_STACK_SIZE": {
      const { nodeId } = action.payload;

      return { type, action, payload: {
          previousStackSize: graph.nodes[nodeId].count
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
        updatedAt: now(),
      };
    }
    case "REDO": {
      const lastChange = graph.history.future.at(-1);
      if (lastChange === undefined) return graph;
      return {
        ...applyActionToGraph(graph, lastChange.action),
        history: { past: [...graph.history.past, lastChange], future: graph.history.future.slice(0, -1) },
        updatedAt: now(),
      };
    }
  }
};