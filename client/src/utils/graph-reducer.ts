import type {
  Graph, GraphAction, GraphChange, ReversibleAction, ProcessrNode, Edge,
} from "../models";

const now = () => new Date().toISOString();

const omitKey = <T>(obj: Readonly<Record<string, T>>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(obj).filter(([id]) => id !== key));

const withNodeUpdate = (graph: Graph, nodeId: string, update: Partial<ProcessrNode>): Graph => ({
  ...graph,
  nodes: { ...graph.nodes, [nodeId]: { ...graph.nodes[nodeId], ...update } },
});

const pickNodeEdges = (edges: Readonly<Record<string, Edge>>, nodeId: string): Record<string, Edge> =>
  Object.fromEntries(Object.entries(edges).filter(([, e]) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId));

const omitNodeEdges = (edges: Readonly<Record<string, Edge>>, nodeId: string): Record<string, Edge> =>
  Object.fromEntries(Object.entries(edges).filter(([, e]) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));

const addChangeToHistory = (graph: Graph, nextGraph: Graph, change: GraphChange): Graph => ({
  ...nextGraph,
  history: { past: [...graph.history.past, change], future: [] },
  updatedAt: now(),
});

const doAction = (graph: Graph, action: GraphAction<ReversibleAction>): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return { ...graph, nodes: { ...graph.nodes, [action.node.id]: action.node } };

    case "REMOVE_NODE":
      return {
        ...graph,
        nodes: omitKey(graph.nodes, action.nodeId),
        edges: omitNodeEdges(graph.edges, action.nodeId),
      };

    case "SET_NODE_POSITIONS": {
      const updates = Object.fromEntries(
        Object.entries(action.positions)
          .filter(([id]) => Object.hasOwn(graph.nodes, id))
          .map(([id, position]) => [id, { ...graph.nodes[id], position }])
      );
      return { ...graph, nodes: { ...graph.nodes, ...updates } };
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const withRecipe = withNodeUpdate(graph, action.nodeId, { recipeId: action.recipeId });
      if (action.behavior === 'delete') {
        return { ...withRecipe, edges: Object.fromEntries(Object.entries(withRecipe.edges).filter(([id]) => !Object.hasOwn(action.invalidEdges, id))) };
      }
      // highlight: mark connected edges as invalid/valid based on recipe compatibility
      return { ...withRecipe, edges: Object.fromEntries(Object.entries(withRecipe.edges).map(([id, edge]) => {
        if (edge.sourceNodeId !== action.nodeId && edge.targetNodeId !== action.nodeId) return [id, edge];
        return [id, Object.hasOwn(action.invalidEdges, id) ? { ...edge, invalid: true } : { ...edge, invalid: undefined }];
      })) };
    }

    case "ADD_EDGE":
      return { ...graph, edges: { ...graph.edges, [action.edge.id]: action.edge } };

    case "REMOVE_EDGE":
      return { ...graph, edges: omitKey(graph.edges, action.edgeId) };
  }
};

const undoAction = (graph: Graph, change: GraphChange): Graph => {
  switch (change.type) {
    case "ADD_NODE":
      return { ...graph, nodes: omitKey(graph.nodes, change.action.node.id) };

    case "REMOVE_NODE":
      return {
        ...graph,
        nodes: { ...graph.nodes, [change.removedNode.id]: change.removedNode },
        edges: { ...graph.edges, ...change.removedEdges },
      };

    case "SET_NODE_POSITIONS": {
      const restores = Object.fromEntries(
        Object.entries(change.previousPositions)
          .filter(([id]) => Object.hasOwn(graph.nodes, id))
          .map(([id, position]) => [id, { ...graph.nodes[id], position }])
      );
      return { ...graph, nodes: { ...graph.nodes, ...restores } };
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, change.action.nodeId)) return graph;
      const restored = withNodeUpdate(graph, change.action.nodeId, { recipeId: change.previousRecipeId });
      if (!change.deletedEdges) return restored;
      return { ...restored, edges: { ...restored.edges, ...change.deletedEdges } };
    }

    case "ADD_EDGE":
      return { ...graph, edges: omitKey(graph.edges, change.action.edge.id) };

    case "REMOVE_EDGE":
      return { ...graph, edges: { ...graph.edges, [change.removedEdge.id]: change.removedEdge } };
  }
};

export const graphReducer = (graph: Graph, action: GraphAction): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return addChangeToHistory(graph, doAction(graph, action), { type: action.type, action, removedNode: action.node });

    case "REMOVE_NODE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const removedNode = graph.nodes[action.nodeId];
      const removedEdges = pickNodeEdges(graph.edges, action.nodeId);
      return addChangeToHistory(graph, doAction(graph, action), { type: action.type, action, removedNode, removedEdges });
    }

    case "SET_NODE_POSITIONS": {
      const previousPositions = Object.fromEntries(
        Object.entries(action.positions)
          .filter(([id]) => Object.hasOwn(graph.nodes, id))
          .map(([id]) => [id, graph.nodes[id].position])
      );
      return addChangeToHistory(graph, doAction(graph, action), { type: action.type, action, previousPositions });
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const previousRecipeId = graph.nodes[action.nodeId].recipeId ?? null;
      const deletedEdges = action.behavior === 'delete' ? action.invalidEdges : undefined;
      return addChangeToHistory(graph, doAction(graph, action), { type: action.type, action, previousRecipeId, deletedEdges });
    }

    case "ADD_EDGE":
      return addChangeToHistory(graph, doAction(graph, action), { type: action.type, action });

    case "REMOVE_EDGE": {
      if (!Object.hasOwn(graph.edges, action.edgeId)) return graph;
      const removedEdge = graph.edges[action.edgeId];
      return addChangeToHistory(graph, doAction(graph, action), { type: action.type, action, removedEdge });
    }

    case "SET_VIEWPORT":
      return { ...graph, viewport: action.viewport };

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
        ...doAction(graph, lastChange.action),
        history: { past: [...graph.history.past, lastChange], future: graph.history.future.slice(0, -1) },
        updatedAt: now(),
      };
    }
  }
};