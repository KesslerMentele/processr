import { describe, it, expect } from "vitest";
import {
  gamePackId,
  itemId,
  nodeTemplateId,
  portId,
  PortDirection,
  recipeId,
  type Atlas,
  type NodeTemplate,
  type Recipe,
  type GraphActionSlice,
  type GraphSlice,
  type UISettingsSlice,
} from "../models";
import { buildAtlasIndex } from "../features/atlas-editor/atlas-index.ts";
import { createGraph, createProcessrNode } from "../utils/graph-factory.ts";
import { createEdge } from "../utils/edge-factory.ts";
import createGraphActions from "../state/graph-actions-slice.ts";

type HarnessState = GraphSlice & UISettingsSlice;

/** Minimal Zustand-style harness: only `set`/`get` are exercised by these actions. */
function createHarness(initialState: HarnessState) {
  const stateRef = { current: initialState };
  const set = (updater: (s: HarnessState) => Partial<HarnessState>) => {
    // eslint-disable-next-line functional/immutable-data
    stateRef.current = { ...stateRef.current, ...updater(stateRef.current) };
  };
  const get = () => stateRef.current;
  const actions: GraphActionSlice = createGraphActions(set as never, get as never, {} as never);
  return { actions, getState: () => stateRef.current };
}

const template: NodeTemplate = {
  id: nodeTemplateId('assembler'),
  name: 'Assembler',
  display: { label: 'Assembler' },
  ports: [
    { id: portId('input-1'), name: 'Input', direction: PortDirection.Input, order: 0, metadata: {} },
    { id: portId('output-1'), name: 'Output', direction: PortDirection.Output, order: 0, metadata: {} },
  ],
  stats: { speedMultiplier: 1, metadata: {} },
  tags: [],
  metadata: {},
};

const makeAtlas = (t: NodeTemplate): Atlas => ({
  id: gamePackId('pack-1'),
  name: 'Test Pack',
  gameName: 'Test Game',
  version: '1.0.0',
  items: [],
  recipes: [],
  nodeTemplates: [t],
  categories: [],
  metadata: {},
});

describe('loadAtlas', () => {
  // Regression: edge port IDs are per-instance (PortInstanceId), but the
  // remapping built during loadAtlas was keyed by template-level PortId.
  // Comparing the two directly meant the lookup always missed, so every
  // edge in the graph was silently dropped on *any* atlas reload — even one
  // where nothing about the connected nodes' ports actually changed.
  it('keeps an edge whose ports are unchanged after reloading a new atlas object', () => {
    const oldAtlas = makeAtlas(template);
    const oldIndex = buildAtlasIndex(oldAtlas);

    const { node: nodeA, portInstances: portInstancesA } = createProcessrNode(template, { x: 0, y: 0 });
    const { node: nodeB, portInstances: portInstancesB } = createProcessrNode(template, { x: 100, y: 0 });
    const outputPort = Object.values(portInstancesA).find(p => p.template.direction === PortDirection.Output);
    const inputPort = Object.values(portInstancesB).find(p => p.template.direction === PortDirection.Input);
    if (!outputPort || !inputPort) throw new Error('fixture template should have an input and output port');
    const edge = createEdge(nodeA.id, nodeB.id, {
      sourcePortId: outputPort.id,
      targetPortId: inputPort.id,
    });

    const graph = {
      ...createGraph(oldAtlas.id, 'Test Factory'),
      nodes: { [nodeA.id]: nodeA, [nodeB.id]: nodeB },
      portInstances: { ...portInstancesA, ...portInstancesB },
      edges: { [edge.id]: edge },
    };

    const { actions, getState } = createHarness({
      graph,
      atlasIndex: oldIndex,
      selectedNodeIds: [],
      draggedNodeTemplateId: null,
      invalidEdgeBehavior: 'delete',
    } as unknown as HarnessState);

    // Same template/ports, but a genuinely new Atlas object — e.g. re-applying
    // the pack editor after an unrelated text edit.
    const newAtlas: Atlas = { ...oldAtlas, version: '1.0.1' };
    actions.loadAtlas(newAtlas);

    const edges = getState().graph.edges;
    expect(Object.keys(edges)).toHaveLength(1);
    const remapped = edges[edge.id];
    expect(remapped).toBeDefined();
    expect(remapped.sourcePortId).toBe(outputPort.id);
    expect(remapped.targetPortId).toBe(inputPort.id);
  });

  // Regression: editing a node template in the atlas (add/remove a port) never
  // touched existing graph nodes spawned from it — `loadAtlas` only remapped
  // edges, leaving `node.ports`/`graph.portInstances` frozen at whatever the
  // template looked like at node-creation time.
  describe('when a node template is edited', () => {
    const inputOnlyTemplate: NodeTemplate = {
      id: nodeTemplateId('smelter'),
      name: 'Smelter',
      display: { label: 'Smelter' },
      ports: [
        { id: portId('ore-in'), name: 'Ore', direction: PortDirection.Input, order: 0, metadata: {} },
      ],
      stats: { speedMultiplier: 1, metadata: {} },
      tags: [],
      metadata: {},
    };

    const setup = (t: NodeTemplate) => {
      const oldAtlas = makeAtlas(t);
      const oldIndex = buildAtlasIndex(oldAtlas);
      const { node, portInstances } = createProcessrNode(t, { x: 0, y: 0 });
      const graph = {
        ...createGraph(oldAtlas.id, 'Test Factory'),
        nodes: { [node.id]: node },
        portInstances,
        edges: {},
      };
      const harness = createHarness({
        graph,
        atlasIndex: oldIndex,
        selectedNodeIds: [],
        draggedNodeTemplateId: null,
        invalidEdgeBehavior: 'delete',
      } as unknown as HarnessState);
      return { oldAtlas, node, ...harness };
    };

    it('adds a port to existing nodes when the template gains one', () => {
      const { oldAtlas, node, actions, getState } = setup(inputOnlyTemplate);

      const templateWithOutput: NodeTemplate = {
        ...inputOnlyTemplate,
        ports: [...inputOnlyTemplate.ports, { id: portId('plate-out'), name: 'Plate', direction: PortDirection.Output, order: 0, metadata: {} }],
      };
      actions.loadAtlas({ ...oldAtlas, nodeTemplates: [templateWithOutput] });

      const resyncedNode = getState().graph.nodes[node.id];
      expect(resyncedNode.ports).toHaveLength(2);

      const portInstances = getState().graph.portInstances;
      const outputPort = resyncedNode.ports.map(id => portInstances[id]).find(p => p.template.direction === PortDirection.Output);
      expect(outputPort).toBeDefined();
    });

    it('drops a node\'s port instance when the template removes it', () => {
      const twoPortTemplate: NodeTemplate = {
        ...inputOnlyTemplate,
        ports: [...inputOnlyTemplate.ports, { id: portId('plate-out'), name: 'Plate', direction: PortDirection.Output, order: 0, metadata: {} }],
      };
      const { oldAtlas, node, actions, getState } = setup(twoPortTemplate);
      const removedPortId = node.ports.find(id => getState().graph.portInstances[id].template.direction === PortDirection.Output);
      expect(removedPortId).toBeDefined();

      actions.loadAtlas({ ...oldAtlas, nodeTemplates: [inputOnlyTemplate] });

      const resyncedNode = getState().graph.nodes[node.id];
      expect(resyncedNode.ports).toHaveLength(1);
      expect(getState().graph.portInstances).not.toHaveProperty(removedPortId as string);
    });

    it('preserves a retained port\'s assigned stack across the edit', () => {
      const oreRecipe: Recipe = {
        id: recipeId('smelt-ore'),
        name: 'Smelt Ore',
        display: { label: 'Smelt Ore' },
        inputs: [{ itemId: itemId('iron-ore'), amount: 1 }],
        outputs: [],
        duration: 1,
        compatibleNodeTypes: [inputOnlyTemplate.id],
        metadata: {},
      };
      const oldAtlas: Atlas = { ...makeAtlas(inputOnlyTemplate), recipes: [oreRecipe] };
      const oldIndex = buildAtlasIndex(oldAtlas);
      const { node, portInstances } = createProcessrNode(inputOnlyTemplate, { x: 0, y: 0 }, { recipeId: oreRecipe.id }, oldIndex);
      // Sanity check the fixture: the input port should already carry the recipe's stack.
      expect(portInstances[node.ports[0]].stack?.itemId).toBe(itemId('iron-ore'));

      const graph = {
        ...createGraph(oldAtlas.id, 'Test Factory'),
        nodes: { [node.id]: node },
        portInstances,
        edges: {},
      };
      const { actions, getState } = createHarness({
        graph,
        atlasIndex: oldIndex,
        selectedNodeIds: [],
        draggedNodeTemplateId: null,
        invalidEdgeBehavior: 'delete',
      } as unknown as HarnessState);

      const templateWithOutput: NodeTemplate = {
        ...inputOnlyTemplate,
        ports: [...inputOnlyTemplate.ports, { id: portId('plate-out'), name: 'Plate', direction: PortDirection.Output, order: 0, metadata: {} }],
      };
      actions.loadAtlas({ ...oldAtlas, nodeTemplates: [templateWithOutput] });

      const resyncedNode = getState().graph.nodes[node.id];
      const retainedInputPort = getState().graph.portInstances[resyncedNode.ports[0]];
      expect(retainedInputPort.stack?.itemId).toBe(itemId('iron-ore'));
    });
  });
});
