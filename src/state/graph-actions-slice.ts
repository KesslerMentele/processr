import type {
  Edge,
  EdgeId, GamePackIndex,
  Graph, GraphActionSlice, GraphSlice,
  Position,
  ProcessrNode,
  ProcessrNodeId,
  RecipeId,
  Viewport
} from "../models";
import type { StateCreator } from "zustand";
import { graphReducer } from "../utils/graph-reducer.ts";


const createGraphActions: StateCreator<GraphSlice & GraphActionSlice, [], [], GraphActionSlice> =
  (set) => ({
    addNode: (node: ProcessrNode) =>
    {set((state) =>
        ({ ...state, graph: graphReducer(state.graph, { type: "ADD_NODE", node }) }));
    },

    removeNode: (nodeId: ProcessrNodeId) =>
    {set((state) =>
        ({ ...state, graph: graphReducer(state.graph, { type: "REMOVE_NODE", nodeId }) }));
    },

    updateNodePosition: (nodeId: ProcessrNodeId, position: Position) =>
    {set((state) =>
        ({ ...state, graph: graphReducer(state.graph, { type: "SET_NODE_POSITION", nodeId, position }) }));
    },

    setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) =>
    {set((state) =>
      ({ ...state, graph: graphReducer(state.graph, { type: "SET_NODE_RECIPE", nodeId, recipeId }) }));
    },

    addEdge: (edge: Edge) =>
    {set((state) =>
        ({ ...state, graph: graphReducer(state.graph, { type: "ADD_EDGE", edge }) }));
    },

    removeEdge: (edgeId: EdgeId) =>
    {set((state) =>
      ({ ...state, graph: graphReducer(state.graph, { type: "REMOVE_EDGE", edgeId }) }));
    },

    setViewport: (viewport: Viewport) =>
    {set((state) =>
        ({ ...state, graph: graphReducer(state.graph, { type: "SET_VIEWPORT", viewport }) }));
    },

    setSelectedNodeId: (id: ProcessrNodeId | null) =>
    {set((state) =>
        ({ ...state, selectedNodeId: id }));
    },

    setScreenToFlowPosition: (fn: ((screenPos:Position) => Position)) =>
    {set((state) =>
      ({ ...state, screenToFlowPosition: fn }));
    },

    loadGraph: (graph: Graph, packIndex: GamePackIndex) =>
    {set((state) =>
        ({ ...state, graph, packIndex: packIndex }));
    },

    screenToFlowPosition: (screenPos:Position) => {
      return screenPos;
    },

    undo: () =>
    {set((state) =>
      ({ ...state, graph:graphReducer(state.graph, { type: "UNDO" }) }));
    },

    redo: () =>
    {set((state) =>
      ({ ...state, graph:graphReducer(state.graph, { type: "REDO" }) }));
    },

});

export default createGraphActions;