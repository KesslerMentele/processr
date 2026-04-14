import type {
  Graph, GraphAction, GraphChange, ReversibleAction
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
  }
};

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
  }
};

export const graphReducer = (graph: Graph, action: GraphAction): Graph => {
  const { type } = action;
  switch (type) {

    case "ADD_NODE":
    case "REMOVE_NODE":
    case "SET_NODE_POSITIONS":
    case "SET_NODE_RECIPE":
    case "ADD_EDGE":
    case "REMOVE_EDGE":
      return addChangeToHistory(graph, applyActionToGraph(graph, action), createGraphChangeForHistory(graph, action));


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