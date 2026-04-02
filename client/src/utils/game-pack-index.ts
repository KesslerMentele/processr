import type {
  GamePack,
  GamePackIndex,
  NodeTemplateId,
  Recipe,
} from "../models";

// Helper: group an array into a Map, skipping items with no key
function groupBy<K, V>(items: readonly V[], key: (v: V) => K | undefined): Map<K, readonly V[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    if (k === undefined) return acc;
    const existing = acc.get(k) ?? [];
    return new Map([...acc, [k, [...existing, item]]]);
  }, new Map<K, readonly V[]>());
}

export function buildGamePackIndex(pack: GamePack): GamePackIndex {

  const nodeIdsByTag: Map<string, readonly NodeTemplateId[]> = pack.nodeTemplates
    .flatMap((node) => node.tags.map((tag) => [tag, node.id] as const))
    .reduce((acc, [tag, nodeId]) => {
      const existing = acc.get(tag) ?? [];
      return new Map([...acc, [tag, [...existing, nodeId]]]);
    }, new Map<string, readonly NodeTemplateId[]>());

  const recipesByNodeType: Map<NodeTemplateId, readonly Recipe[]> = pack.recipes
    .flatMap((recipe) => {
      const exactIds = recipe.compatibleNodeTypes;
      const tagIds = (recipe.compatibleNodeTags ?? [])
        .flatMap((tag) => nodeIdsByTag.get(tag) ?? []);
      const nodeIds = [...new Set([...exactIds, ...tagIds])];
      // Unconstrained recipe (no types or tags) → matches every node
      const targets =
        nodeIds.length > 0 ? nodeIds : pack.nodeTemplates.map((n) => n.id);
      return targets.map((id) => [id, recipe] as const);
    })
    .reduce((acc, [nodeId, recipe]) => {
      const existing = acc.get(nodeId) ?? [];
      return new Map([...acc, [nodeId, [...existing, recipe]]]);
    }, new Map<NodeTemplateId, readonly Recipe[]>());

  return {
    pack,
    itemsById: new Map(pack.items.map((i) => [i.id, i])),
    recipesById: new Map(pack.recipes.map((r) => [r.id, r])),
    nodeTemplatesById: new Map(pack.nodeTemplates.map((n) => [n.id, n])),
    categoriesById: new Map(pack.categories.map((c) => [c.id, c])),
    recipesByNodeType,
    itemsByCategory: groupBy(pack.items, (item) => item.categoryId),
  };
}
