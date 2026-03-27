import type {
  ActionType,
  Graph,
  GraphAction,
} from "../models";


const now = () => new Date().toISOString();

export const graphReducer = (graph: Graph, action: GraphAction<ActionType>): Graph => {
  switch (action.type) {
    case "ADD_NODE":
      return {...graph, nodes: [...graph.nodes, action.node], updatedAt: now() }
    case "REMOVE_NODE":
      return {
        ...graph,
        nodes: graph.nodes.filter((n) => n.id !== action.nodeId),
        edges: graph.edges.filter((e) => e.sourceNodeId !== action.nodeId && e.targetNodeId !== action.nodeId),
        updatedAt: now()
      }
    case "UPDATE_NODE_POSITION":
      return {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === action.nodeId ? {...n, position: action.position} : n),
        updatedAt: now()
      }
    case "SET_NODE_RECIPE":
      return {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === action.nodeId ? {...n, recipeId: action.recipeId} : n),
        updatedAt: now()
      }
    case "ADD_EDGE":
      return {
        ...graph,
        edges: [...graph.edges, action.edge],
        updatedAt: now()
      }
    case "REMOVE_EDGE":
      return {
        ...graph,
        edges: graph.edges.filter((e) => e.id !== action.edgeId),
        updatedAt: now()
      }
    case "SET_VIEWPORT":
      return {
        ...graph,
        viewport: action.viewport,
      }
    case "UNDO": { throw new Error('Not implemented yet: "UNDO" case') }
    case "REDO": { throw new Error('Not implemented yet: "REDO" case') }
  }
}