import type {
  Edge, EdgeId,
  Atlas, AtlasIndex, GraphActionSlice, GraphSlice,
  NodeTemplateId,
  PortId, PortInstance, Position, ProcessrNode, ProcessrNodeId,
  RecipeId,
  Viewport
} from "../models";
import { PortDirection } from "../models";
import type { UISettingsSlice } from "../models";
import type { StateCreator } from "zustand";
import { graphReducer } from "../reducers/graph-reducer.ts";
import { buildAtlasIndex } from "../features/atlas-editor/atlas-index.ts";
import { cloneNode, createGraph } from "../utils/graph-factory.ts";
import { saveAtlas } from "../utils/persistence.ts";
import type { SetGraphData } from "../models/state/graph-state.ts";
import { applyPortInstances, applySingleNodeUpdate, findInvalidEdges, pickKeys, pickNodeEdges } from "../utils/graph-utils.ts";
import { applyRecipeToPorts } from "../utils/node-utils.ts";
import { newEdgeId } from "../utils/id.ts";
import { portInstanceId, type PortInstanceId } from "../models/ids.ts";

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

/**
 * Rewrites an edge's port IDs using `portRemapping`, dropping it (returns `null`)
 * if either endpoint node is gone or the remapped port no longer exists on its template.
 */
const remapEdge = (
  edgeId: string,
  edge: Edge,
  nodes: NodeRecord,
  portInstances: Readonly<Record<PortInstanceId, PortInstance>>,
  packIndex: AtlasIndex,
  portRemapping: PortRemapping,
): [string, Edge] | null => {

  const sourceNode = nodes[edge.sourceNodeId] as ProcessrNode | undefined;
  const targetNode = nodes[edge.targetNodeId] as ProcessrNode | undefined;
  if (!sourceNode || !targetNode) return null;

  // Edge port IDs are per-instance (node ID + template port ID); resolve back
  // to the template-level port ID before consulting the (template-keyed) remapping.
  if (!sourceNode.ports.includes(edge.sourcePortId) || !targetNode.ports.includes(edge.targetPortId)) return null;
  const sourcePortInstance = portInstances[edge.sourcePortId];
  const targetPortInstance = portInstances[edge.targetPortId];

  const newSourcePortId = portRemapping.get(sourceNode.templateId)?.get(sourcePortInstance.template.id) ?? sourcePortInstance.template.id;
  const newTargetPortId = portRemapping.get(targetNode.templateId)?.get(targetPortInstance.template.id) ?? targetPortInstance.template.id;

  const sourceTemplate = packIndex.nodeTemplatesById.get(sourceNode.templateId);
  const targetTemplate = packIndex.nodeTemplatesById.get(targetNode.templateId);
  if (!sourceTemplate?.ports.some(p => p.id === newSourcePortId)) return null;
  if (!targetTemplate?.ports.some(p => p.id === newTargetPortId)) return null;

  return [edgeId, {
    ...edge,
    sourcePortId: portInstanceId(sourceNode.id + newSourcePortId),
    targetPortId: portInstanceId(targetNode.id + newTargetPortId),
  }];
};

/**
 * Recomputes a node's `ports` (and the PortInstance records they reference) against
 * its template as it exists in `packIndex` — the counterpart to `remapEdge`, but for
 * the node's own port list rather than an edge's endpoints.
 *
 * A port that maps 1:1 from the old template (per `portRemapping`) keeps its `stack`/
 * `item`, reassigned to the new port-instance id. A port newly added to the template
 * gets a fresh, unstacked PortInstance. A port dropped from the template — and its
 * PortInstance — simply isn't carried over. If the template itself no longer exists
 * in the pack, the node's ports are left untouched (same as `ProcessrNodeComponent`'s
 * "template not found" fallback).
 */
const resyncNodePorts = (
  node: ProcessrNode,
  portInstances: Readonly<Record<PortInstanceId, PortInstance>>,
  packIndex: AtlasIndex,
  portRemapping: PortRemapping,
): { node: ProcessrNode; portInstances: Readonly<Record<PortInstanceId, PortInstance>> } => {
  const newTemplate = packIndex.nodeTemplatesById.get(node.templateId);
  if (!newTemplate) return { node, portInstances: pickKeys(portInstances, node.ports) };

  const remap = portRemapping.get(node.templateId);
  const oldByTemplatePortId = new Map(
    node.ports.map(id => [portInstances[id].template.id, portInstances[id]] as const)
  );

  const resyncedPorts: PortInstance[] = newTemplate.ports.map((newPort): PortInstance => {
    const oldPortId = remap && [...remap.entries()].find(([, mapped]) => mapped === newPort.id)?.[0];
    const oldInstance = oldPortId ? oldByTemplatePortId.get(oldPortId) : undefined;
    return {
      id: portInstanceId(node.id + newPort.id),
      template: newPort,
      stack: oldInstance?.stack,
      item: oldInstance?.item,
    };
  });

  return {
    node: { ...node, ports: resyncedPorts.map(p => p.id) },
    portInstances: Object.fromEntries(resyncedPorts.map(p => [p.id, p] as const)),
  };
};

/** Zustand action creators for mutating the graph — all dispatch through `graphReducer` for undo/redo support. */
const createGraphActions: StateCreator<GraphSlice & GraphActionSlice & UISettingsSlice, [], [], GraphActionSlice> =
  (set) => ({
    addNode: ({ node, portInstances }) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "ADD_NODE", payload: { node, portInstances } }) }));
    },

    removeNode: (nodeId: ProcessrNodeId) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "REMOVE_NODE",  payload: { nodeId } }) }));
    },

    /** Bulk-updates canvas positions for one or more nodes, keyed by node ID. */
    updateNodePositions: (positions: Readonly<Record<string, Position>>) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_NODE_POSITIONS",  payload: { positions } }) }));
    },

    /**
     * Assigns or clears a recipe on a node, recomputing its ports and flagging
     * any edges the new recipe makes invalid.
     */
    setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) =>
    {set((state) => {
      const ports = applyRecipeToPorts(state.graph.nodes[nodeId], recipeId, state.atlasIndex, state.graph.portInstances);
      // Compute invalid edges against the graph with the new recipe already applied,
      // so we detect incompatibilities introduced by the change (not the old state).
      const tempGraph = applyPortInstances(applySingleNodeUpdate(state.graph, nodeId, { recipeId }), ports);
      const invalidEdges = findInvalidEdges(nodeId, tempGraph, state.atlasIndex);

      return ({ graph: graphReducer(state.graph, { type: "SET_NODE_RECIPE", payload: { nodeId, recipeId, ports, invalidEdges, behavior: state.invalidEdgeBehavior } }) });
    });
    },

    /** Same as `setNodeRecipe`, but applies a batch of recipe changes as a single atomic update. */
    setNodeRecipes: (updates: { nodeId: ProcessrNodeId; recipeId: RecipeId | null }[]) =>
    {set((state) => {
      const behavior = state.invalidEdgeBehavior;
      const fullUpdates = updates.reduce<{ tempGraph: typeof state.graph; acc: { nodeId: ProcessrNodeId; recipeId: RecipeId | null; ports: ReturnType<typeof applyRecipeToPorts>; invalidEdges: Readonly<Record<string, Edge>> }[] }>(
        ({ tempGraph, acc }, { nodeId, recipeId }) => {
          const ports = applyRecipeToPorts(tempGraph.nodes[nodeId], recipeId, state.atlasIndex, tempGraph.portInstances);
          const updatedGraph = applyPortInstances(applySingleNodeUpdate(tempGraph, nodeId, { recipeId }), ports);
          const invalidEdges = findInvalidEdges(nodeId, updatedGraph, state.atlasIndex);
          return { tempGraph: updatedGraph, acc: [...acc, { nodeId, recipeId, ports, invalidEdges }] };
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

    /** Merges the selected nodes into a single stacked node (keeping the topmost), summing their counts. */
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

    /** Splits one unit off a stacked node into a new node, cloning its edges. */
    unstackNode: (nodeId: ProcessrNodeId) =>
    {set((state) => {
      const source = state.graph.nodes[nodeId];
      if (source.count <= 1) return state;
      const template = state.atlasIndex.nodeTemplatesById.get(source.templateId);
      if (!template) return state;

      const count = source.count;
      const clones = Array.from({ length: count - 1 }, (_, i) =>
        cloneNode(source, template, { x: source.position.x, y: source.position.y + (i + 1) * 160 }, state.atlasIndex)
      );
      const newNodes = clones.map(c => c.node);
      const newPortInstances: Readonly<Record<PortInstanceId, PortInstance>> = Object.fromEntries(
        clones.flatMap(c => Object.entries(c.portInstances))
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
          payload: { nodeId, newNodes, newPortInstances, newEdges },
        }),
      };
    });
    },

    /** Directly sets a stacked node's count (unit size). */
    setNodeStackSize: (nodeId: ProcessrNodeId, newStackSize: number) =>
    {set((state) =>
      ({ graph: graphReducer(state.graph, { type: "SET_STACK_SIZE", payload: { nodeId, newStackSize } }) }));
    },

    /** Replaces the active graph and atlas index (or creates a fresh graph if none is given). */
    loadGraph: (data:SetGraphData) =>
    {set((state) => {
      const { graph, atlasIndex } = data;
      return { ...state,
        graph: graph ? graph : createGraph(atlasIndex.atlas.id, "My Factory"),
        atlasIndex: atlasIndex };
    });
    },

    /** Reverts the graph to the previous entry in its undo history. */
    undo: () =>
    {set((state) =>
      ({ ...state, graph:graphReducer(state.graph, { type: "UNDO" }) }));
    },

    /** Re-applies the next entry in the graph's redo history. */
    redo: () =>
    {set((state) =>
      ({ ...state, graph:graphReducer(state.graph, { type: "REDO" }) }));
    },

    /** Tracks which node template is currently being dragged from the sidebar, for drop handling. */
    setDraggedTemplateId: (id: NodeTemplateId | null) =>
    {set((state) =>
      ({ ...state, draggedTemplateId: id }));
    },

    /**
     * Swaps in a new atlas/game pack: rebuilds the index, remaps existing edges'
     * port IDs to the new templates (dropping edges whose ports no longer exist),
     * and persists the pack to localStorage.
     */
    loadAtlas: (pack: Atlas) =>
    {set((state) => {
      const packIndex = buildAtlasIndex(pack);
      const portRemapping = buildPortRemapping(state.atlasIndex, packIndex);

      // Edges are remapped against the *old* nodes/portInstances (their sourcePortId/
      // targetPortId still reference the pre-edit port ids); the resync below computes
      // the very same new port-instance ids independently, so the two line back up.
      const remappedEdges = Object.fromEntries(
        Object.entries(state.graph.edges)
          .map(([id, edge]) => remapEdge(id, edge, state.graph.nodes, state.graph.portInstances, packIndex, portRemapping))
          .filter((entry): entry is [string, Edge] => entry !== null)
      );

      const resyncedNodes = Object.values(state.graph.nodes).map(node =>
        resyncNodePorts(node, state.graph.portInstances, packIndex, portRemapping)
      );
      const nodes = Object.fromEntries(resyncedNodes.map(r => [r.node.id, r.node]));
      const portInstances: Readonly<Record<PortInstanceId, PortInstance>> = Object.fromEntries(
        resyncedNodes.flatMap(r => Object.entries(r.portInstances))
      );

      saveAtlas(pack);
      const graph = { ...state.graph, nodes, portInstances, edges: remappedEdges };
      return { ...state, atlasIndex: packIndex, graph };
    });
    },

  });

export default createGraphActions;