import type {
  Edge, EdgeId,
  Atlas, AtlasIndex, GraphActionSlice, GraphSlice,
  NodeTemplateId,
  PortId, Position, ProcessrNode, ProcessrNodeId,
  RecipeId,
  Viewport
} from "../models";
import { PortDirection } from "../models";
import type { UISettingsSlice } from "../models";
import type { StateCreator } from "zustand";
import { graphReducer } from "../reducers/graph-reducer.ts";
import { buildAtlasIndex } from "../features/atlas/atlas-index.ts";
import { cloneNode, createGraph } from "../utils/graph-factory.ts";
import { saveAtlas } from "../utils/persistence.ts";
import type { SetGraphData } from "../models/state/graph-state.ts";
import { findInvalidEdges, pickNodeEdges } from "../utils/graph-utils.ts";
import { newEdgeId } from "../utils/id.ts";

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
      ({ graph: graphReducer(state.graph, { type: "ADD_NODE", payload: { node } }) }));
    },

    removeNode: (nodeId: ProcessrNodeId) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "REMOVE_NODE",  payload: { nodeId } }) }));
    },

    updateNodePositions: (positions: Readonly<Record<string, Position>>) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_NODE_POSITIONS",  payload: { positions } }) }));
    },

    setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) =>
    {set((state) => {
      // Compute invalid edges against the graph with the new recipe already applied,
      // so we detect incompatibilities introduced by the change (not the old state).
      const tempGraph = { ...state.graph, nodes: { ...state.graph.nodes, [nodeId]: { ...state.graph.nodes[nodeId], recipeId } } };
      const invalidEdges = findInvalidEdges(nodeId, tempGraph, state.atlasIndex);

      return ({ graph: graphReducer(state.graph, { type: "SET_NODE_RECIPE", payload: { nodeId, recipeId, invalidEdges, behavior: state.invalidEdgeBehavior } }) });
    });
    },

    setNodeRecipes: (updates: { nodeId: ProcessrNodeId; recipeId: RecipeId | null }[]) =>
    {set((state) => {
      const behavior = state.invalidEdgeBehavior;
      const fullUpdates = updates.reduce<{ tempGraph: typeof state.graph; acc: { nodeId: ProcessrNodeId; recipeId: RecipeId | null; invalidEdges: Readonly<Record<string, Edge>> }[] }>(
        ({ tempGraph, acc }, { nodeId, recipeId }) => {
          const updatedGraph = { ...tempGraph, nodes: { ...tempGraph.nodes, [nodeId]: { ...tempGraph.nodes[nodeId], recipeId } } };
          const invalidEdges = findInvalidEdges(nodeId, updatedGraph, state.atlasIndex);
          return { tempGraph: updatedGraph, acc: [...acc, { nodeId, recipeId, invalidEdges }] };
        },
        { tempGraph: state.graph, acc: [] }
      ).acc;
      return { graph: graphReducer(state.graph, { type: "SET_MULTI_NODE_RECIPES", payload: { updates: fullUpdates, behavior } }) };
    });
    },

    addEdge: (edge: Edge) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "ADD_EDGE",  payload: { edge } }) }));
    },

    removeEdge: (edgeId: EdgeId) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "REMOVE_EDGE",  payload: { edgeId } }) }));
    },

    setViewport: (viewport: Viewport) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_VIEWPORT",  payload: { viewport } }) }));
    },

    setSelectedNodeIds: (ids: readonly ProcessrNodeId[]) =>
    {set((state) => {
      if (ids.length === state.selectedNodeIds.length && ids.every((id, i) => id === state.selectedNodeIds[i])) return {};
      return { selectedNodeIds: ids };
    });
    },

    stackNodes: (selectedNodeIds: readonly ProcessrNodeId[]) =>
    {set((state) => {
      const nodes = selectedNodeIds.map(id => state.graph.nodes[id]).filter(Boolean);
      if (nodes.length < 2) return state;
      const survivor = nodes.reduce((min, n) => n.position.y < min.position.y ? n : min);
      const removedIds = selectedNodeIds.filter(id => id !== survivor.id);
      return {
        selectedNodeIds: [survivor.id],
        graph: graphReducer(state.graph, {
          type: "STACK_NODES",
          payload: {
            survivorId: survivor.id,
            removedIds,
            newCount: nodes.reduce((acc, node) => {
              return acc + node.count;
            }, 0)
          } }),
      };
    });
    },

    unstackNode: (nodeId: ProcessrNodeId) =>
    {set((state) => {
      const source = state.graph.nodes[nodeId];
      if (source.count <= 1) return state;
      const template = state.atlasIndex.nodeTemplatesById.get(source.templateId);
      if (!template) return state;

      const count = source.count;
      const newNodes = Array.from({ length: count - 1 }, (_, i) =>
        cloneNode(source, template, { x: source.position.x, y: source.position.y + (i + 1) * 160 })
      );

      const sourceEdges = Object.values(pickNodeEdges(state.graph.edges, nodeId));
      const newEdges = Object.fromEntries(
        newNodes.flatMap(newNode =>
          sourceEdges.map(edge => {
            const newEdge: Edge = {
              ...edge,
              id: newEdgeId(),
              sourceNodeId: edge.sourceNodeId === nodeId ? newNode.id : edge.sourceNodeId,
              targetNodeId: edge.targetNodeId === nodeId ? newNode.id : edge.targetNodeId,
            };
            return [newEdge.id, newEdge] as const;
          })
        )
      );

      return {
        graph: graphReducer(state.graph, {
          type: "UNSTACK_NODE",
          payload: { nodeId, newNodes, newEdges },
        }),
      };
    });
    },

    setNodeStackSize: (nodeId: ProcessrNodeId, newStackSize: number) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_STACK_SIZE", payload: { nodeId, newStackSize } }) }));
    },

    loadGraph: (data:SetGraphData) =>
    {set((state) => {
      const { graph, atlasIndex } = data;
      return { ...state,
        graph: graph ? graph : createGraph(atlasIndex.atlas.id, "My Factory"),
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