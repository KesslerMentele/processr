import type {
  Edge,
  EdgeId, GamePack, GamePackIndex,
  Graph, GraphActionSlice, GraphSlice, NodeTemplateId, PortId, Position,
  ProcessrNode,
  ProcessrNodeId,
  RecipeId,
  Viewport
} from "../models";
import { PortDirection } from "../models";
import type { StateCreator } from "zustand";
import { graphReducer } from "../utils/graph-reducer.ts";
import { buildGamePackIndex } from "../utils/game-pack-index.ts";
import { isNodeLevelEdge } from "../utils/type-validators.ts";

/**
 * For each template present in both indices, builds a map from old port ID
 * to new port ID by matching ports positionally within each direction group.
 * Ports that have no counterpart in the new template are omitted (edge gets dropped).
 */
const buildPortRemapping = (
  oldIndex: GamePackIndex,
  newIndex: GamePackIndex,
): Map<NodeTemplateId, Map<PortId, PortId>> =>
  new Map(
    [...newIndex.nodeTemplatesById.entries()].flatMap(([templateId, newTemplate]) => {
      const oldTemplate = oldIndex.nodeTemplatesById.get(templateId);
      if (!oldTemplate) return [];
      const oldInputs  = oldTemplate.ports.filter(p => p.direction === PortDirection.Input);
      const oldOutputs = oldTemplate.ports.filter(p => p.direction === PortDirection.Output);
      const newInputs  = newTemplate.ports.filter(p => p.direction === PortDirection.Input);
      const newOutputs = newTemplate.ports.filter(p => p.direction === PortDirection.Output);
      const portMap = new Map<PortId, PortId>([
        ...oldInputs.flatMap((p, i): [PortId, PortId][] => newInputs[i] ? [[p.id, newInputs[i].id]] : []),
        ...oldOutputs.flatMap((p, i): [PortId, PortId][] => newOutputs[i] ? [[p.id, newOutputs[i].id]] : []),
      ]);
      return [[templateId, portMap] as [NodeTemplateId, Map<PortId, PortId>]];
    })
  );


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
    {set((state) => {
      const packIndex = buildGamePackIndex(pack);
      const portRemapping = buildPortRemapping(state.packIndex, packIndex);

      const remappedEdges = Object.fromEntries(
        Object.entries(state.graph.edges).flatMap(([edgeId, edge]): [string, Edge][] => {
          if (isNodeLevelEdge(edge)) return [[edgeId, edge]];

          const sourceNode = state.graph.nodes[edge.sourceNodeId];
          const targetNode = state.graph.nodes[edge.targetNodeId];
          if (!sourceNode || !targetNode) return [];

          const newSourcePortId = portRemapping.get(sourceNode.templateId)?.get(edge.sourcePortId) ?? edge.sourcePortId;
          const newTargetPortId = portRemapping.get(targetNode.templateId)?.get(edge.targetPortId) ?? edge.targetPortId;

          const sourceTemplate = packIndex.nodeTemplatesById.get(sourceNode.templateId);
          const targetTemplate = packIndex.nodeTemplatesById.get(targetNode.templateId);
          if (!sourceTemplate?.ports.some(p => p.id === newSourcePortId)) return [];
          if (!targetTemplate?.ports.some(p => p.id === newTargetPortId)) return [];

          const remappedEdge: Edge = { ...edge, sourcePortId: newSourcePortId, targetPortId: newTargetPortId };
          return [[edgeId, remappedEdge]];
        })
      );

      const graph = { ...state.graph, edges: remappedEdges };
      return { ...state, packIndex, graph };
    });
    },

  });

export default createGraphActions;