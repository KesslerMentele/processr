import type {
  Graph,
  GraphAction,
} from "../models";

const now = () => new Date().toISOString();

export const graphReducer = (state: Graph, action: GraphAction): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return {...state, nodes: [...state.nodes, action.node], updatedAt: now() }
    case "REMOVE_NODE":
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.nodeId),
        edges: state.edges.filter((e) => e.sourceNodeId !== action.nodeId && e.targetNodeId !== action.nodeId),
        updatedAt: now()
      }
    case "UPDATE_NODE_POSITION":
      return {
        ...state,
        nodes: state.nodes.map((n) => n.id === action.nodeId ? {...n, position: action.position} : n),
        updatedAt: now()
      }
    case "SET_NODE_RECIPE":
      return {
        ...state,
        nodes: state.nodes.map((n) => n.id === action.nodeId ? {...n, recipeId: action.recipeId} : n),
        updatedAt: now()
      }
    case "ADD_EDGE":
      return {
        ...state,
        edges: [...state.edges, action.edge],
        updatedAt: now()
      }
    case "REMOVE_EDGE":
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== action.edgeId),
        updatedAt: now()
      }
    case "SET_VIEWPORT":
      return {
        ...state,
        viewport: action.viewport,
      }
    case "LOAD_GRAPH":
      return action.graph;

  }
}