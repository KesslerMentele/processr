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

const withHistory = (graph: Graph, nextGraph: Graph, change: GraphChange): Graph => ({
  ...nextGraph,
  history: { past: [...graph.history.past, change], future: [] },
  updatedAt: now(),
});

const applyForward = (graph: Graph, action: GraphAction<ReversibleAction>): Graph => {
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

    case "SET_NODE_RECIPE":
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      return withNodeUpdate(graph, action.nodeId, { recipeId: action.recipeId });

    case "ADD_EDGE":
      return { ...graph, edges: { ...graph.edges, [action.edge.id]: action.edge } };

    case "REMOVE_EDGE":
      return { ...graph, edges: omitKey(graph.edges, action.edgeId) };
  }
};

const applyReverse = (graph: Graph, change: GraphChange): Graph => {
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

    case "SET_NODE_RECIPE":
      if (!Object.hasOwn(graph.nodes, change.action.nodeId)) return graph;
      return withNodeUpdate(graph, change.action.nodeId, { recipeId: change.previousRecipeId });

    case "ADD_EDGE":
      return { ...graph, edges: omitKey(graph.edges, change.action.edge.id) };

    case "REMOVE_EDGE":
      return { ...graph, edges: { ...graph.edges, [change.removedEdge.id]: change.removedEdge } };
  }
};

export const graphReducer = (graph: Graph, action: GraphAction): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return withHistory(graph, applyForward(graph, action), { type: action.type, action, removedNode: action.node });

    case "REMOVE_NODE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const removedNode = graph.nodes[action.nodeId];
      const removedEdges = pickNodeEdges(graph.edges, action.nodeId);
      return withHistory(graph, applyForward(graph, action), { type: action.type, action, removedNode, removedEdges });
    }

    case "SET_NODE_POSITIONS": {
      const previousPositions = Object.fromEntries(
        Object.entries(action.positions)
          .filter(([id]) => Object.hasOwn(graph.nodes, id))
          .map(([id]) => [id, graph.nodes[id].position])
      );
      return withHistory(graph, applyForward(graph, action), { type: action.type, action, previousPositions });
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const previousRecipeId = graph.nodes[action.nodeId].recipeId ?? null;
      return withHistory(graph, applyForward(graph, action), { type: action.type, action, previousRecipeId });
    }

    case "ADD_EDGE":
      return withHistory(graph, applyForward(graph, action), { type: action.type, action });

    case "REMOVE_EDGE": {
      if (!Object.hasOwn(graph.edges, action.edgeId)) return graph;
      const removedEdge = graph.edges[action.edgeId];
      return withHistory(graph, applyForward(graph, action), { type: action.type, action, removedEdge });
    }

    case "SET_VIEWPORT":
      return { ...graph, viewport: action.viewport };

    case "UNDO": {
      const lastChange = graph.history.past.at(-1);
      if (lastChange === undefined) return graph;
      return {
        ...applyReverse(graph, lastChange),
        history: { past: graph.history.past.slice(0, -1), future: [...graph.history.future, lastChange] },
        updatedAt: now(),
      };
    }

    case "REDO": {
      const lastChange = graph.history.future.at(-1);
      if (lastChange === undefined) return graph;
      return {
        ...applyForward(graph, lastChange.action),
        history: { past: [...graph.history.past, lastChange], future: graph.history.future.slice(0, -1) },
        updatedAt: now(),
      };
    }
  }
};