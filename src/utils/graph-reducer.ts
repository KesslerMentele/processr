import type {
  Graph, GraphAction, GraphChange, ReversibleAction,
} from "../models";


const now = () => new Date().toISOString();

/** Applies the forward state transformation for a reversible action, without touching history. */
const applyForward = (graph: Graph, action: GraphAction<ReversibleAction>): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return { ...graph, nodes: { ...graph.nodes, [action.node.id]: action.node } };

    case "REMOVE_NODE":
      return {
        ...graph,
        nodes: Object.fromEntries(Object.entries(graph.nodes).filter(([id]) => id !== action.nodeId)),
        edges: Object.fromEntries(Object.entries(graph.edges).filter(
          ([, edge]) => edge.sourceNodeId !== action.nodeId && edge.targetNodeId !== action.nodeId
        )),
      };

    case "SET_NODE_POSITION": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const node = graph.nodes[action.nodeId];
      return { ...graph, nodes: { ...graph.nodes, [action.nodeId]: { ...node, position: action.position } } };
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const node = graph.nodes[action.nodeId];
      return { ...graph, nodes: { ...graph.nodes, [action.nodeId]: { ...node, recipeId: action.recipeId } } };
    }

    case "ADD_EDGE": {

      return { ...graph, edges: { ...graph.edges, [action.edge.id]: action.edge } };
    }

    case "REMOVE_EDGE":
      return { ...graph, edges: Object.fromEntries(Object.entries(graph.edges).filter(([id]) => id !== action.edgeId)) };
  }
};

/** Applies the inverse transformation for a recorded change. */
const applyReverse = (graph: Graph, change: GraphChange): Graph => {
  switch (change.type) {
    case "ADD_NODE":
      return { ...graph, nodes: Object.fromEntries(Object.entries(graph.nodes).filter(([id]) => id !== change.action.node.id)) };

    case "REMOVE_NODE":
      return {
        ...graph,
        nodes: { ...graph.nodes, [change.removedNode.id]: change.removedNode },
        edges: { ...graph.edges, ...change.removedEdges },
      };

    case "SET_NODE_POSITION": {
      if (!Object.hasOwn(graph.nodes, change.action.nodeId)) return graph;
      const node = graph.nodes[change.action.nodeId];
      return { ...graph, nodes: { ...graph.nodes, [change.action.nodeId]: { ...node, position: change.previousPosition } } };
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, change.action.nodeId)) return graph;
      const node = graph.nodes[change.action.nodeId];
      return { ...graph, nodes: { ...graph.nodes, [change.action.nodeId]: { ...node, recipeId: change.previousRecipeId } } };
    }

    case "ADD_EDGE":
      return { ...graph, edges: Object.fromEntries(Object.entries(graph.edges).filter(([id]) => id !== change.action.edge.id)) };

    case "REMOVE_EDGE":
      return { ...graph, edges: { ...graph.edges, [change.removedEdge.id]: change.removedEdge } };
  }
};


export const graphReducer = (graph: Graph, action: GraphAction): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return {
        ...applyForward(graph, action),
        history: { past: [...graph.history.past, { type: action.type, action, removedNode: action.node }], future: [] },
        updatedAt: now(),
      };

    case "REMOVE_NODE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const removedNode = graph.nodes[action.nodeId];
      const removedEdges = Object.fromEntries(Object.entries(graph.edges).filter(
        ([, edge]) => edge.sourceNodeId === action.nodeId || edge.targetNodeId === action.nodeId
      ));
      return {
        ...applyForward(graph, action),
        history: { past: [...graph.history.past, { type: action.type, action, removedNode, removedEdges }], future: [] },
        updatedAt: now(),
      };
    }

    case "SET_NODE_POSITION": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const previousPosition = graph.nodes[action.nodeId].position;
      return {
        ...applyForward(graph, action),
        history: { past: [...graph.history.past, { type: action.type, action, previousPosition }], future: [] },
        updatedAt: now(),
      };
    }

    case "SET_NODE_RECIPE": {
      if (!Object.hasOwn(graph.nodes, action.nodeId)) return graph;
      const previousRecipeId = graph.nodes[action.nodeId].recipeId ?? null;
      return {
        ...applyForward(graph, action),
        history: { past: [...graph.history.past, { type: action.type, action, previousRecipeId }], future: [] },
        updatedAt: now(),
      };
    }

    case "ADD_EDGE":
      return {
        ...applyForward(graph, action),
        history: { past: [...graph.history.past, { type: action.type, action }], future: [] },
        updatedAt: now(),
      };

    case "REMOVE_EDGE": {
      if (!Object.hasOwn(graph.edges, action.edgeId)) return graph;
      const removedEdge = graph.edges[action.edgeId];
      return {
        ...applyForward(graph, action),
        history: { past: [...graph.history.past, { type: action.type, action, removedEdge }], future: [] },
        updatedAt: now(),
      };
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