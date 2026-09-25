import { describe, it, expect } from "vitest";
import {
  gamePackId,
  itemId,
  nodeTemplateId,
  portId,
  recipeId,
  PortDirection,
  type Atlas,
  type NodeTemplate,
  type Recipe,
} from "../models";
import { buildAtlasIndex } from "../features/atlas-editor/atlas-index.ts";
import { createProcessrNode } from "../utils/graph-factory.ts";
import { getPorts, getOutputPorts, getRates, withRenderPositions } from "../utils/node-utils.ts";
import { omitKey } from "../utils/graph-utils.ts";

const template: NodeTemplate = {
  id: nodeTemplateId('furnace'),
  name: 'Furnace',
  display: { label: 'Furnace' },
  ports: [
    { id: portId('in'), name: 'Input', direction: PortDirection.Input, order: 0, metadata: {} },
    { id: portId('out'), name: 'Output', direction: PortDirection.Output, order: 0, metadata: {} },
  ],
  stats: { speedMultiplier: 1, metadata: {} },
  tags: [],
  metadata: {},
};

const recipe: Recipe = {
  id: recipeId('smelt-iron'),
  name: 'Smelt Iron',
  display: { label: 'Smelt Iron' },
  inputs: [{ itemId: itemId('iron-ore'), amount: 1 }],
  outputs: [{ itemId: itemId('iron-plate'), amount: 1 }],
  duration: 4,
  compatibleNodeTypes: [template.id],
  metadata: {},
};

const atlas: Atlas = {
  id: gamePackId('pack-1'),
  name: 'Test Pack',
  gameName: 'Test Game',
  version: '1.0.0',
  items: [],
  recipes: [recipe],
  nodeTemplates: [template],
  categories: [],
  metadata: {},
};
const atlasIndex = buildAtlasIndex(atlas);

describe('getRates', () => {
  // Regression: getRates used to multiply by `duration` instead of dividing by
  // it, so a slower (longer-duration) recipe reported a *higher* rate.
  it('computes rate as amount * speedMultiplier / duration, not amount * duration', () => {
    const { node, portInstances } = createProcessrNode(template, { x: 0, y: 0 }, { recipeId: recipe.id }, atlasIndex);
    const rates = getRates(atlasIndex, node, portInstances);
    const outputRate = Object.values(Object.values(rates?.output ?? {})[0])[0];
    expect(outputRate).toBeCloseTo(1 * 1 / 4); // 0.25/s, not 4/s
  });

  // Regression: getRates ignored `instance.count` (stack size) entirely, so a
  // stack of N machines reported the same rate as a single machine.
  it('scales the rate by the node stack count', () => {
    const { node, portInstances } = createProcessrNode(template, { x: 0, y: 0 }, { recipeId: recipe.id, count: 3 }, atlasIndex);
    const rates = getRates(atlasIndex, node, portInstances);
    const outputRate = Object.values(Object.values(rates?.output ?? {})[0])[0];
    expect(outputRate).toBeCloseTo((1 * 1 / 4) * 3); // 0.75/s
  });

  // Regression: a recipe assigned at node-creation time (e.g. auto-selected
  // because it's the template's only compatible recipe) left ports without a
  // `.stack`, so the node silently contributed nothing to the stats panel.
  it('contributes a rate immediately when the recipe is assigned at creation time', () => {
    const { node, portInstances } = createProcessrNode(template, { x: 0, y: 0 }, { recipeId: recipe.id }, atlasIndex);
    const outputPort = Object.values(portInstances).find(p => p.template.direction === PortDirection.Output);
    expect(outputPort?.stack).toBeDefined();

    const rates = getRates(atlasIndex, node, portInstances);
    expect(Object.keys(rates?.output ?? {})).toHaveLength(1);
  });
});

describe('getInputPorts / getOutputPorts', () => {
  // Regression: `graph.portInstances` is a separate record from `node.ports`
  // (an id list) — if they ever fall out of sync (e.g. a stale persisted graph
  // saved under an earlier schema, or a future bug in a reducer case), indexing
  // a missing id returned `undefined`, and both functions crashed the whole
  // node — and by extension the canvas — instead of degrading gracefully.
  it('skips a port id that has no matching entry in portInstances, instead of throwing', () => {
    const { node, portInstances } = createProcessrNode(template, { x: 0, y: 0 });
    const missingPortId = node.ports.find(p => portInstances[p].template.direction === PortDirection.Input);
    if (!missingPortId) throw new Error('fixture template should have an input port');
    const brokenPortInstances = omitKey(portInstances, missingPortId);

    expect(() => getPorts(node, brokenPortInstances)).not.toThrow();
    expect(getPorts(node, brokenPortInstances)).toHaveLength(0);
    // The output port is untouched and should still resolve normally.
    expect(getOutputPorts(node, brokenPortInstances)).toHaveLength(1);
  });
});

describe('withRenderPositions', () => {
  // Regression: ports were placed by an optional `PortTemplate.position` hint
  // that defaulted to 0.5 when unset, so any two ports without an explicit
  // hint (e.g. every port built via the "Add Node" form) rendered on top of
  // each other. Placement is now always computed from array order instead.
  it('centers a single port', () => {
    expect(withRenderPositions(['a']).map(p => p.renderPosition)).toEqual([0.5]);
  });

  it('spaces multiple ports evenly, with none at the very ends', () => {
    const positions = withRenderPositions(['a', 'b', 'c']).map(p => p.renderPosition);
    expect(positions).toEqual([0.25, 0.5, 0.75]);
  });

  it('preserves the original fields alongside renderPosition', () => {
    const [result] = withRenderPositions([{ id: 'x' }]);
    expect(result).toEqual({ id: 'x', renderPosition: 0.5 });
  });
});
