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
import { getRates } from "../utils/node-utils.ts";

const template: NodeTemplate = {
  id: nodeTemplateId('furnace'),
  name: 'Furnace',
  display: { label: 'Furnace' },
  ports: [
    { id: portId('in'), name: 'Input', direction: PortDirection.Input, metadata: {} },
    { id: portId('out'), name: 'Output', direction: PortDirection.Output, metadata: {} },
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
    const node = createProcessrNode(template, { x: 0, y: 0 }, { recipeId: recipe.id }, atlasIndex);
    const rates = getRates(atlasIndex, node);
    const outputRate = Object.values(rates?.output ?? {})[0];
    expect(outputRate.rate).toBeCloseTo(1 * 1 / 4); // 0.25/s, not 4/s
  });

  // Regression: getRates ignored `instance.count` (stack size) entirely, so a
  // stack of N machines reported the same rate as a single machine.
  it('scales the rate by the node stack count', () => {
    const node = createProcessrNode(template, { x: 0, y: 0 }, { recipeId: recipe.id, count: 3 }, atlasIndex);
    const rates = getRates(atlasIndex, node);
    const outputRate = Object.values(rates?.output ?? {})[0];
    expect(outputRate.rate).toBeCloseTo((1 * 1 / 4) * 3); // 0.75/s
  });

  // Regression: a recipe assigned at node-creation time (e.g. auto-selected
  // because it's the template's only compatible recipe) left ports without a
  // `.stack`, so the node silently contributed nothing to the stats panel.
  it('contributes a rate immediately when the recipe is assigned at creation time', () => {
    const node = createProcessrNode(template, { x: 0, y: 0 }, { recipeId: recipe.id }, atlasIndex);
    const outputPort = node.ports.find(p => p.template.direction === PortDirection.Output);
    expect(outputPort?.stack).toBeDefined();

    const rates = getRates(atlasIndex, node);
    expect(Object.keys(rates?.output ?? {})).toHaveLength(1);
  });
});
