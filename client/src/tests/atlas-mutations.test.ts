import { describe, it, expect } from "vitest";
import {
  slugifyId,
  addItem,
  addCategory,
  addNodeTemplate,
  addRecipe,
} from "../features/atlas-editor/atlas-mutations.ts";
import {
  gamePackId,
  itemId,
  categoryId,
  PortDirection,
  type Atlas,
} from "../models";

const emptyPack: Atlas = {
  id: gamePackId('pack-1'),
  name: 'Test Pack',
  gameName: 'Test Game',
  version: '1.0.0',
  items: [],
  recipes: [],
  nodeTemplates: [],
  categories: [],
  metadata: {},
};

describe('slugifyId', () => {
  it('lowercases and hyphenates a label', () => {
    expect(slugifyId('Iron Plate', new Set())).toBe('iron-plate');
  });

  it('collapses runs of invalid characters into a single hyphen', () => {
    expect(slugifyId('Copper  Cable!!', new Set())).toBe('copper-cable');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugifyId('  -Water-  ', new Set())).toBe('water');
  });

  it('prefixes with "x-" when the label would not start with a letter', () => {
    expect(slugifyId('3d-printer', new Set())).toBe('x-3d-printer');
  });

  it('falls back to "x" for a label with no valid characters', () => {
    expect(slugifyId('!!!', new Set())).toBe('x');
  });

  it('returns the base slug unchanged when there is no collision', () => {
    expect(slugifyId('furnace', new Set(['stone-furnace']))).toBe('furnace');
  });

  it('dedupes against existing ids by appending -2, -3, ...', () => {
    expect(slugifyId('furnace', new Set(['furnace']))).toBe('furnace-2');
    expect(slugifyId('furnace', new Set(['furnace', 'furnace-2']))).toBe('furnace-3');
  });
});

describe('addItem', () => {
  it('generates an id slug from the name', () => {
    const atlas = addItem(emptyPack, { name: 'Iron Plate' });
    expect(atlas.items[0].id).toBe(itemId('iron-plate'));
  });

  it('sets the display label to the name', () => {
    const atlas = addItem(emptyPack, { name: 'Iron Plate' });
    expect(atlas.items[0].display.label).toBe('Iron Plate');
  });

  it('includes optional fields when provided', () => {
    const atlas = addItem(emptyPack, {
      name: 'Iron Plate',
      color: '#ff0000',
      icon: '/icons/iron-plate.png',
      description: 'A smelted plate',
      form: 'solid',
      categoryId: categoryId('intermediates'),
    });
    const item = atlas.items[0];
    expect(item.display.color).toBe('#ff0000');
    expect(item.display.icon).toBe('/icons/iron-plate.png');
    expect(item.display.description).toBe('A smelted plate');
    expect(item.form).toBe('solid');
    expect(item.categoryId).toBe(categoryId('intermediates'));
  });

  it('omits optional fields when not provided', () => {
    const atlas = addItem(emptyPack, { name: 'Iron Plate' });
    const item = atlas.items[0];
    expect(item).not.toHaveProperty('categoryId');
    expect(item).not.toHaveProperty('form');
    expect(item.display).not.toHaveProperty('color');
  });

  it('defaults to empty metadata', () => {
    const atlas = addItem(emptyPack, { name: 'Iron Plate' });
    expect(atlas.items[0].metadata).toEqual({});
  });

  it('appends without mutating the original atlas', () => {
    const atlas = addItem(emptyPack, { name: 'Iron Plate' });
    expect(emptyPack.items).toHaveLength(0);
    expect(atlas.items).toHaveLength(1);
    expect(atlas).not.toBe(emptyPack);
  });

  it('dedupes ids against existing items', () => {
    const withOne = addItem(emptyPack, { name: 'Iron Plate' });
    const withTwo = addItem(withOne, { name: 'Iron Plate' });
    expect(withTwo.items.map(i => i.id)).toEqual(['iron-plate', 'iron-plate-2']);
  });
});

describe('addCategory', () => {
  it('generates an id slug and display label from the name', () => {
    const atlas = addCategory(emptyPack, { name: 'Intermediate Products' });
    const category = atlas.categories[0];
    expect(category.id).toBe(categoryId('intermediate-products'));
    expect(category.display.label).toBe('Intermediate Products');
  });

  it('includes sortOrder and parentId when provided', () => {
    const atlas = addCategory(emptyPack, { name: 'Sub Category', sortOrder: 2, parentId: categoryId('parent') });
    const category = atlas.categories[0];
    expect(category.sortOrder).toBe(2);
    expect(category.parentId).toBe(categoryId('parent'));
  });

  it('omits sortOrder and parentId when not provided', () => {
    const atlas = addCategory(emptyPack, { name: 'Raw Resources' });
    const category = atlas.categories[0];
    expect(category).not.toHaveProperty('sortOrder');
    expect(category).not.toHaveProperty('parentId');
  });
});

describe('addNodeTemplate', () => {
  it('defaults to one input and one output port when none are given', () => {
    const atlas = addNodeTemplate(emptyPack, { name: 'Stone Furnace' });
    const template = atlas.nodeTemplates[0];
    expect(template.ports).toHaveLength(2);
    expect(template.ports[0].direction).toBe(PortDirection.Input);
    expect(template.ports[0].name).toBe('Input');
    expect(template.ports[1].direction).toBe(PortDirection.Output);
    expect(template.ports[1].name).toBe('Output');
  });

  it('builds custom ports with deduped ids when provided', () => {
    const atlas = addNodeTemplate(emptyPack, {
      name: 'Assembling Machine',
      ports: [
        { name: 'Input', direction: PortDirection.Input },
        { name: 'Input', direction: PortDirection.Input },
        { name: 'Output', direction: PortDirection.Output },
      ],
    });
    const ids = atlas.nodeTemplates[0].ports.map(p => p.id);
    expect(ids).toEqual(['input', 'input-2', 'output']);
  });

  it('defaults speedMultiplier to 1 and tags to an empty array', () => {
    const atlas = addNodeTemplate(emptyPack, { name: 'Stone Furnace' });
    const template = atlas.nodeTemplates[0];
    expect(template.stats.speedMultiplier).toBe(1);
    expect(template.tags).toEqual([]);
  });

  it('includes powerConsumption and moduleSlots only when provided', () => {
    const withStats = addNodeTemplate(emptyPack, { name: 'Furnace', powerConsumption: 90, moduleSlots: 2 });
    expect(withStats.nodeTemplates[0].stats.powerConsumption).toBe(90);
    expect(withStats.nodeTemplates[0].stats.moduleSlots).toBe(2);

    const withoutStats = addNodeTemplate(emptyPack, { name: 'Furnace' });
    expect(withoutStats.nodeTemplates[0].stats).not.toHaveProperty('powerConsumption');
    expect(withoutStats.nodeTemplates[0].stats).not.toHaveProperty('moduleSlots');
  });
});

describe('addRecipe', () => {
  it('generates an id slug and requires a duration', () => {
    const atlas = addRecipe(emptyPack, { name: 'Smelt Iron Plate', duration: 3.2 });
    const recipe = atlas.recipes[0];
    expect(recipe.id).toBe('smelt-iron-plate');
    expect(recipe.duration).toBe(3.2);
  });

  it('defaults inputs, outputs, and compatibleNodeTypes to empty arrays', () => {
    const atlas = addRecipe(emptyPack, { name: 'Pump Water', duration: 1 });
    const recipe = atlas.recipes[0];
    expect(recipe.inputs).toEqual([]);
    expect(recipe.outputs).toEqual([]);
    expect(recipe.compatibleNodeTypes).toEqual([]);
  });

  it('carries through explicit inputs, outputs, and compatible node types', () => {
    const stack = { itemId: itemId('iron-ore'), amount: 1 };
    const atlas = addRecipe(emptyPack, {
      name: 'Smelt Iron Plate',
      duration: 3.2,
      inputs: [stack],
      outputs: [{ itemId: itemId('iron-plate'), amount: 1 }],
      compatibleNodeTypes: [],
    });
    expect(atlas.recipes[0].inputs).toEqual([stack]);
    expect(atlas.recipes[0].outputs).toEqual([{ itemId: itemId('iron-plate'), amount: 1 }]);
  });

  it('omits durationUnit and compatibleNodeTags when not provided', () => {
    const atlas = addRecipe(emptyPack, { name: 'Pump Water', duration: 1 });
    expect(atlas.recipes[0]).not.toHaveProperty('durationUnit');
    expect(atlas.recipes[0]).not.toHaveProperty('compatibleNodeTags');
  });
});
