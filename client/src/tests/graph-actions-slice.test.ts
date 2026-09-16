import { describe, it, expect } from "vitest";
import {
  gamePackId,
  nodeTemplateId,
  portId,
  PortDirection,
  type Atlas,
  type NodeTemplate,
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
    { id: portId('input-1'), name: 'Input', direction: PortDirection.Input, metadata: {} },
    { id: portId('output-1'), name: 'Output', direction: PortDirection.Output, metadata: {} },
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

    const nodeA = createProcessrNode(template, { x: 0, y: 0 });
    const nodeB = createProcessrNode(template, { x: 100, y: 0 });
    const outputPort = nodeA.ports.find(p => p.template.direction === PortDirection.Output);
    const inputPort = nodeB.ports.find(p => p.template.direction === PortDirection.Input);
    if (!outputPort || !inputPort) throw new Error('fixture template should have an input and output port');
    const edge = createEdge(nodeA.id, nodeB.id, {
      sourcePortId: outputPort.id,
      targetPortId: inputPort.id,
    });

    const graph = {
      ...createGraph(oldAtlas.id, 'Test Factory'),
      nodes: { [nodeA.id]: nodeA, [nodeB.id]: nodeB },
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
});
