import type {
    Edge,
    EdgeId, GamePack, GamePackIndex,
    Graph, GraphActionSlice, GraphSlice, NodeTemplateId, Position,
    ProcessrNode,
    ProcessrNodeId,
    RecipeId,
    Viewport
} from "../models";
import type { StateCreator } from "zustand";
import { graphReducer } from "../utils/graph-reducer.ts";
import { buildGamePackIndex } from "../utils/game-pack-index.ts";


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

    updateNodePositions: (positions: Readonly<Record<string, Position>>) =>
    {set((state) =>
      ({ ...state, graph: graphReducer(state.graph, { type: "SET_NODE_POSITIONS", positions }) }));
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

    loadGraph: (graph: Graph, packIndex: GamePackIndex) =>
    {set((state) =>
      ({ ...state, graph, packIndex: packIndex }));
    },

    undo: () =>
    {set((state) =>
      ({ ...state, graph:graphReducer(state.graph, { type: "UNDO" }) }));
    },

    redo: () =>
    {set((state) =>
      ({ ...state, graph:graphReducer(state.graph, { type: "REDO" }) }));
    },

    setDraggedTemplateId: (id: NodeTemplateId | null) =>
    {set((state) =>
      ({ ...state, draggedTemplateId: id }));
    },

    loadGamePack: (pack: GamePack) =>
    {set((state) =>
      ({ ...state, packIndex: buildGamePackIndex(pack) }));
    },

  });

export default createGraphActions;