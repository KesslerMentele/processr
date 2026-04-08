import { describe, it, expect } from 'vitest';
import { buildGamePackIndex } from './game-pack-index.ts';
import {
  categoryId,
  gamePackId,
  itemId,
  nodeTemplateId,
  recipeId,
  type Atlas,
  type Item,
  type NodeTemplate,
  type Recipe,
} from '../models';

// --- Fixtures ---

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

const makeTemplate = (id: string, tags: string[] = []): NodeTemplate => ({
  id: nodeTemplateId(id),
  name: id,
  display: { label: id },
  ports: [],
  stats: { speedMultiplier: 1, metadata: {} },
  tags,
  metadata: {},
});

const makeRecipe = (id: string, nodeTypes: string[] = [], nodeTags: string[] = []): Recipe => ({
  id: recipeId(id),
  name: id,
  display: { label: id },
  inputs: [],
  outputs: [],
  duration: 1,
  compatibleNodeTypes: nodeTypes.map(nodeTemplateId),
  ...(nodeTags.length > 0 ? { compatibleNodeTags: nodeTags } : {}),
  metadata: {},
});

const makeItem = (id: string, catId?: string): Item => ({
  id: itemId(id),
  name: id,
  display: { label: id },
  form: 'solid',
  ...(catId ? { categoryId: categoryId(catId) } : {}),
  metadata: {},
});

// --- Tests ---

describe('buildGamePackIndex', () => {

  describe('lookup maps', () => {
    it('indexes items by id', () => {
      const item = makeItem('iron');
      const index = buildGamePackIndex({ ...emptyPack, items: [item] });
      expect(index.itemsById.get(item.id)).toEqual(item);
    });

    it('indexes recipes by id', () => {
      const recipe = makeRecipe('gear');
      const index = buildGamePackIndex({ ...emptyPack, recipes: [recipe] });
      expect(index.recipesById.get(recipe.id)).toEqual(recipe);
    });

    it('indexes node templates by id', () => {
      const template = makeTemplate('assembler');
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [template] });
      expect(index.nodeTemplatesById.get(template.id)).toEqual(template);
    });

    it('indexes categories by id', () => {
      const cat = { id: categoryId('metals'), name: 'Metals', display: { label: 'Metals' }, sortOrder: 0, metadata: {} };
      const index = buildGamePackIndex({ ...emptyPack, categories: [cat] });
      expect(index.categoriesById.get(cat.id)).toEqual(cat);
    });
  });

  describe('recipesByNodeType', () => {
    it('maps a recipe to its explicitly compatible node types', () => {
      const template = makeTemplate('assembler');
      const recipe = makeRecipe('gear', ['assembler']);
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [template], recipes: [recipe] });
      expect(index.recipesByNodeType.get(template.id)).toContainEqual(recipe);
    });

    it('maps a recipe to node types matched by tag', () => {
      const template = makeTemplate('assembler', ['machine']);
      const recipe = makeRecipe('gear', [], ['machine']);
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [template], recipes: [recipe] });
      expect(index.recipesByNodeType.get(template.id)).toContainEqual(recipe);
    });

    it('maps an unconstrained recipe to all node types', () => {
      const assembler = makeTemplate('assembler');
      const furnace = makeTemplate('furnace');
      const recipe = makeRecipe('wire');
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [assembler, furnace], recipes: [recipe] });
      expect(index.recipesByNodeType.get(assembler.id)).toContainEqual(recipe);
      expect(index.recipesByNodeType.get(furnace.id)).toContainEqual(recipe);
    });

    it('does not duplicate a recipe matched by both type and tag', () => {
      const template = makeTemplate('assembler', ['machine']);
      const recipe = makeRecipe('gear', ['assembler'], ['machine']);
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [template], recipes: [recipe] });
      const recipes = index.recipesByNodeType.get(template.id) ?? [];
      expect(recipes.filter((r) => r.id === recipe.id)).toHaveLength(1);
    });

    it('does not assign a constrained recipe to non-matching node types', () => {
      const assembler = makeTemplate('assembler');
      const furnace = makeTemplate('furnace');
      const recipe = makeRecipe('gear', ['assembler']);
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [assembler, furnace], recipes: [recipe] });
      expect(index.recipesByNodeType.get(furnace.id) ?? []).not.toContainEqual(recipe);
    });

    it('matches recipes across multiple tags', () => {
      const assembler = makeTemplate('assembler', ['machine', 'electric']);
      const recipe = makeRecipe('gear', [], ['electric']);
      const index = buildGamePackIndex({ ...emptyPack, nodeTemplates: [assembler], recipes: [recipe] });
      expect(index.recipesByNodeType.get(assembler.id)).toContainEqual(recipe);
    });
  });

  describe('itemsByCategory', () => {
    it('groups items under their category', () => {
      const cat = { id: categoryId('metals'), name: 'Metals', display: { label: 'Metals' }, sortOrder: 0, metadata: {} };
      const iron = makeItem('iron', 'metals');
      const copper = makeItem('copper', 'metals');
      const index = buildGamePackIndex({ ...emptyPack, items: [iron, copper], categories: [cat] });
      const grouped = index.itemsByCategory.get(cat.id) ?? [];
      expect(grouped).toContainEqual(iron);
      expect(grouped).toContainEqual(copper);
    });

    it('does not include items with no category in any group', () => {
      const water = makeItem('water');
      const index = buildGamePackIndex({ ...emptyPack, items: [water] });
      const allGrouped = [...index.itemsByCategory.values()].flat();
      expect(allGrouped).not.toContainEqual(water);
    });
  });

});