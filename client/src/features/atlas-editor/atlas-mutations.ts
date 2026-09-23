import type {
  Atlas, Category, CategoryId,
  DisplayInfo, Item, ItemId,
  NodeTemplate, NodeTemplateId, PortId,
  PortTemplate, Recipe, RecipeId,
} from "../../models";
import { categoryId, itemId, nodeTemplateId, portId, recipeId, PortDirection } from "../../models";
import type {
  AddCategoryInput,
  AddItemInput,
  AddNodeTemplateInput,
  AddNodeTemplatePortInput,
  AddRecipeInput
} from "./atlas-types.ts";

/**
 * Slugifies a label into an identifier matching the atlas grammar
 * (`[a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*`), then dedupes it against
 * `existingIds` by appending `-2`, `-3`, ... on collision.
 */
export const slugifyId = (label: string, existingIds: ReadonlySet<string>): string => {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const candidate = base === "" ? "x" : /^[a-z]/.test(base) ? base : `x-${base}`;
  if (!existingIds.has(candidate)) return candidate;
  const withSuffix = (n: number) => `${candidate}-${String(n)}`;
  const suffixed = Array.from({ length: existingIds.size + 1 }, (_, i) => withSuffix(i + 2))
    .find((id) => !existingIds.has(id));
  return suffixed ?? withSuffix(existingIds.size + 2);
};

const display = (name: string, color?: string, icon?: string, description?: string): DisplayInfo => ({
  label: name,
  ...(description !== undefined && { description }),
  ...(icon !== undefined && { icon }),
  ...(color !== undefined && { color }),
});

const replaceById = <T extends { readonly id: string }>(
  list: readonly T[],
  id: T["id"],
  build: (existing: T) => T
): readonly T[] => list.map((entry) => (entry.id === id ? build(entry) : entry));

// ---- Items ----

const buildItem = (id: ItemId, input: AddItemInput, existing?: Item): Item => ({
  id,
  name: input.name,
  display: display(input.name, input.color, input.icon, input.description),
  ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
  ...(input.form !== undefined && { form: input.form }),
  metadata: existing?.metadata ?? {},
});

export const addItem = (atlas: Atlas, input: AddItemInput): Atlas => {
  const id: ItemId = itemId(slugifyId(input.name, new Set(atlas.items.map((i) => i.id))));
  return { ...atlas, items: [...atlas.items, buildItem(id, input)] };
};

export const updateItem = (atlas: Atlas, id: ItemId, input: AddItemInput): Atlas => ({
  ...atlas,
  items: replaceById(atlas.items, id, (existing) => buildItem(id, input, existing)),
});

export const itemToInput = (item: Item): AddItemInput => ({
  name: item.name,
  ...(item.categoryId !== undefined && { categoryId: item.categoryId }),
  ...(item.form !== undefined && { form: item.form }),
  ...(item.display.color !== undefined && { color: item.display.color }),
  ...(item.display.icon !== undefined && { icon: item.display.icon }),
  ...(item.display.description !== undefined && { description: item.display.description }),
});

// ---- Categories ----



export const addCategory = (atlas: Atlas, input: AddCategoryInput): Atlas => {
  const id: CategoryId = categoryId(slugifyId(input.name, new Set(atlas.categories.map((c) => c.id))));
  const category: Category = {
    id,
    name: input.name,
    display: display(input.name, input.color, input.icon),
    ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    ...(input.parentId !== undefined && { parentId: input.parentId }),
  };
  return { ...atlas, categories: [...atlas.categories, category] };
};

// ---- Node templates ----



const DEFAULT_NODE_PORTS: readonly AddNodeTemplatePortInput[] = [
  { name: "Input", direction: PortDirection.Input },
  { name: "Output", direction: PortDirection.Output },
];

const buildPorts = (inputs: readonly AddNodeTemplatePortInput[]): readonly PortTemplate[] => {
  return inputs.reduce<readonly PortTemplate[]>((ports, input) => {
    const id: PortId = portId(slugifyId(input.name, new Set(ports.map((p) => p.id))));
    // Order is per-direction: the Nth input gets order N-1, independent of
    // however many outputs (or other inputs) come before/after it.
    const order = ports.filter((p) => p.direction === input.direction).length;
    const port: PortTemplate = {
      id,
      name: input.name,
      direction: input.direction,
      order,
      metadata: {},
    };
    return [...ports, port];
  }, []);
};

const buildNodeTemplate = (id: NodeTemplateId, input: AddNodeTemplateInput, existing?: NodeTemplate): NodeTemplate => ({
  id,
  name: input.name,
  display: display(input.name, input.color, input.icon),
  ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
  ports: buildPorts(input.ports ?? DEFAULT_NODE_PORTS),
  stats: {
    speedMultiplier: input.speedMultiplier ?? 1,
    ...(input.powerConsumption !== undefined && { powerConsumption: input.powerConsumption }),
    ...(input.moduleSlots !== undefined && { moduleSlots: input.moduleSlots }),
    metadata: existing?.stats.metadata ?? {},
  },
  metadata: existing?.metadata ?? {},
  tags: input.tags ?? [],
});

export const addNodeTemplate = (atlas: Atlas, input: AddNodeTemplateInput): Atlas => {
  const id: NodeTemplateId = nodeTemplateId(slugifyId(input.name, new Set(atlas.nodeTemplates.map((n) => n.id))));
  return { ...atlas, nodeTemplates: [...atlas.nodeTemplates, buildNodeTemplate(id, input)] };
};

export const updateNodeTemplate = (atlas: Atlas, id: NodeTemplateId, input: AddNodeTemplateInput): Atlas => ({
  ...atlas,
  nodeTemplates: replaceById(atlas.nodeTemplates, id, (existing) => buildNodeTemplate(id, input, existing)),
});

export const nodeTemplateToInput = (template: NodeTemplate): AddNodeTemplateInput => ({
  name: template.name,
  ...(template.categoryId !== undefined && { categoryId: template.categoryId }),
  ...(template.display.color !== undefined && { color: template.display.color }),
  ...(template.display.icon !== undefined && { icon: template.display.icon }),
  speedMultiplier: template.stats.speedMultiplier,
  ...(template.stats.powerConsumption !== undefined && { powerConsumption: template.stats.powerConsumption }),
  ...(template.stats.moduleSlots !== undefined && { moduleSlots: template.stats.moduleSlots }),
  ports: template.ports.map((port) => ({
    name: port.name,
    direction: port.direction,
  })),
  tags: template.tags,
});

// ---- Recipes ----

const buildRecipe = (id: RecipeId, input: AddRecipeInput, existing?: Recipe): Recipe => ({
  id,
  name: input.name,
  display: display(input.name, undefined, input.icon),
  ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
  inputs: input.inputs ?? [],
  outputs: input.outputs ?? [],
  duration: input.duration,
  ...(input.durationUnit !== undefined && { durationUnit: input.durationUnit }),
  compatibleNodeTypes: input.compatibleNodeTypes ?? [],
  ...(input.compatibleNodeTags !== undefined && { compatibleNodeTags: input.compatibleNodeTags }),
  metadata: existing?.metadata ?? {},
});

export const addRecipe = (atlas: Atlas, input: AddRecipeInput): Atlas => {
  const id: RecipeId = recipeId(slugifyId(input.name, new Set(atlas.recipes.map((r) => r.id))));
  return { ...atlas, recipes: [...atlas.recipes, buildRecipe(id, input)] };
};

export const updateRecipe = (atlas: Atlas, id: RecipeId, input: AddRecipeInput): Atlas => ({
  ...atlas,
  recipes: replaceById(atlas.recipes, id, (existing) => buildRecipe(id, input, existing)),
});

export const recipeToInput = (recipe: Recipe): AddRecipeInput => ({
  name: recipe.name,
  duration: recipe.duration,
  ...(recipe.durationUnit !== undefined && { durationUnit: recipe.durationUnit }),
  ...(recipe.categoryId !== undefined && { categoryId: recipe.categoryId }),
  ...(recipe.display.icon !== undefined && { icon: recipe.display.icon }),
  inputs: recipe.inputs,
  outputs: recipe.outputs,
  compatibleNodeTypes: recipe.compatibleNodeTypes,
  ...(recipe.compatibleNodeTags !== undefined && { compatibleNodeTags: recipe.compatibleNodeTags }),
});
