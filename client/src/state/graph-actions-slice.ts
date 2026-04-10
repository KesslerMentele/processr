import type {
  Edge, EdgeId,
  Atlas, AtlasIndex, GraphActionSlice, GraphSlice,
  NodeTemplateId,
  PortId, Position, ProcessrNode, ProcessrNodeId,
  RecipeId,
  Viewport
} from "../models";
import { PortDirection } from "../models";
import type { UISettingsSlice } from "../models/state/ui-state.ts";
import type { StateCreator } from "zustand";
import { graphReducer } from "../utils/graph-reducer.ts";
import { buildAtlasIndex } from "../utils/atlas-index.ts";
import { isNodeLevelEdge } from "../utils/type-validators.ts";
import { createGraph } from "../utils/graph-factory.ts";
import { saveAtlas } from "../utils/persistence.ts";
import type { SetGraphData } from "../models/state/graph-state.ts";
import { findInvalidEdges } from "../utils/graph-utils.ts";

/**
 * For each template present in both indices, builds a map from old port ID
 * to new port ID by matching ports positionally within each direction group.
 * Ports that have no counterpart in the new template are omitted (edge gets dropped).
 */
const buildPortRemapping = (
  oldIndex: AtlasIndex,
  newIndex: AtlasIndex,
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


type NodeRecord = Readonly<Record<string, ProcessrNode>>;
type PortRemapping = ReadonlyMap<NodeTemplateId, ReadonlyMap<PortId, PortId>>;

const remapEdge = (
  edgeId: string,
  edge: Edge,
  nodes: NodeRecord,
  packIndex: AtlasIndex,
  portRemapping: PortRemapping,
): [string, Edge] | null => {
  if (isNodeLevelEdge(edge)) return [edgeId, edge];

  const sourceNode = nodes[edge.sourceNodeId] as ProcessrNode | undefined;
  const targetNode = nodes[edge.targetNodeId] as ProcessrNode | undefined;
  if (!sourceNode || !targetNode) return null;

  const newSourcePortId = portRemapping.get(sourceNode.templateId)?.get(edge.sourcePortId) ?? edge.sourcePortId;
  const newTargetPortId = portRemapping.get(targetNode.templateId)?.get(edge.targetPortId) ?? edge.targetPortId;

  const sourceTemplate = packIndex.nodeTemplatesById.get(sourceNode.templateId);
  const targetTemplate = packIndex.nodeTemplatesById.get(targetNode.templateId);
  if (!sourceTemplate?.ports.some(p => p.id === newSourcePortId)) return null;
  if (!targetTemplate?.ports.some(p => p.id === newTargetPortId)) return null;

  return [edgeId, { ...edge, sourcePortId: newSourcePortId, targetPortId: newTargetPortId }];
};

const createGraphActions: StateCreator<GraphSlice & GraphActionSlice & UISettingsSlice, [], [], GraphActionSlice> =
  (set) => ({
    addNode: (node: ProcessrNode) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "ADD_NODE", node }) }));
    },

    removeNode: (nodeId: ProcessrNodeId) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "REMOVE_NODE", nodeId }) }));
    },

    updateNodePositions: (positions: Readonly<Record<string, Position>>) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_NODE_POSITIONS", positions }) }));
    },

    setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) =>
    {set((state) => {
      // Compute invalid edges against the graph with the new recipe already applied,
      // so we detect incompatibilities introduced by the change (not the old state).
      const tempGraph = { ...state.graph, nodes: { ...state.graph.nodes, [nodeId]: { ...state.graph.nodes[nodeId], recipeId } } };
      const invalidEdges = findInvalidEdges(nodeId, tempGraph, state.atlasIndex);

      return ({ graph: graphReducer(state.graph, { type: "SET_NODE_RECIPE", nodeId, recipeId, invalidEdges, behavior: state.invalidEdgeBehavior }) });
    });
    },

    addEdge: (edge: Edge) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "ADD_EDGE", edge }) }));
    },

    removeEdge: (edgeId: EdgeId) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "REMOVE_EDGE", edgeId }) }));
    },

    setViewport: (viewport: Viewport) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_VIEWPORT", viewport }) }));
    },

    setSelectedNodeId: (id: ProcessrNodeId | null) =>
    {set(() =>
      ({ selectedNodeId: id }));
    },

    loadGraph: (data:SetGraphData) =>
    {set((state) => {
      const { graph, atlasIndex } = data;
      return { ...state,
        graph: graph ? graph : createGraph(atlasIndex.pack.id, "My Factory"),
        atlasIndex: atlasIndex };
    });
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

    loadAtlas: (pack: Atlas) =>
    {set((state) => {
      const packIndex = buildAtlasIndex(pack);
      const portRemapping = buildPortRemapping(state.atlasIndex, packIndex);

      const remappedEdges = Object.fromEntries(
        Object.entries(state.graph.edges)
          .map(([id, edge]) => remapEdge(id, edge, state.graph.nodes, packIndex, portRemapping))
          .filter((entry): entry is [string, Edge] => entry !== null)
      );

      saveAtlas(pack);
      const graph = { ...state.graph, edges: remappedEdges };
      return { ...state, atlasIndex: packIndex, graph };
    });
    },

  });

export default createGraphActions;