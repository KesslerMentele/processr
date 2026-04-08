import type {
  Atlas,
  GamePackIndex,
  NodeTemplateId,
  Recipe,
} from "../models";

// Helper: group pre-formed [key, value] pairs into a Map
function groupPairs<K, V>(pairs: readonly (readonly [K, V])[]): Map<K, readonly V[]> {
  return pairs.reduce((acc, [k, v]) => {
    const existing = acc.get(k) ?? [];
    return new Map([...acc, [k, [...existing, v]]]);
  }, new Map<K, readonly V[]>());
}

export function buildGamePackIndex(pack: Atlas): GamePackIndex {

  const nodeIdsByTag = groupPairs(
    pack.nodeTemplates.flatMap((node) => node.tags.map((tag) => [tag, node.id] as const))
  );

  const recipesByNodeType: Map<NodeTemplateId, readonly Recipe[]> = groupPairs(
    pack.recipes.flatMap((recipe) => {
      const exactIds = recipe.compatibleNodeTypes;
      const tagIds = (recipe.compatibleNodeTags ?? [])
        .flatMap((tag) => nodeIdsByTag.get(tag) ?? []);
      const nodeIds = [...new Set([...exactIds, ...tagIds])];
      // Unconstrained recipe (no types or tags) → matches every node
      const targets =
        nodeIds.length > 0 ? nodeIds : pack.nodeTemplates.map((n) => n.id);
      return targets.map((id) => [id, recipe] as const);
    })
  );

  return {
    pack,
    itemsById: new Map(pack.items.map((i) => [i.id, i])),
    recipesById: new Map(pack.recipes.map((r) => [r.id, r])),
    nodeTemplatesById: new Map(pack.nodeTemplates.map((n) => [n.id, n])),
    categoriesById: new Map(pack.categories.map((c) => [c.id, c])),
    recipesByNodeType,
    itemsByCategory: groupPairs(
      pack.items.flatMap((i) => i.categoryId ? [[i.categoryId, i] as const] : [])
    ),
  };
}