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

// ---- Items ----



export const addItem = (atlas: Atlas, input: AddItemInput): Atlas => {
  const id: ItemId = itemId(slugifyId(input.name, new Set(atlas.items.map((i) => i.id))));
  const item: Item = {
    id,
    name: input.name,
    display: display(input.name, input.color, input.icon, input.description),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.form !== undefined && { form: input.form }),
    metadata: {},
  };
  return { ...atlas, items: [...atlas.items, item] };
};

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
    const port: PortTemplate = {
      id,
      name: input.name,
      direction: input.direction,
      ...(input.position !== undefined && { position: input.position }),
      metadata: {},
    };
    return [...ports, port];
  }, []);
};

export const addNodeTemplate = (atlas: Atlas, input: AddNodeTemplateInput): Atlas => {
  const id: NodeTemplateId = nodeTemplateId(slugifyId(input.name, new Set(atlas.nodeTemplates.map((n) => n.id))));
  const nodeTemplate: NodeTemplate = {
    id,
    name: input.name,
    display: display(input.name, input.color, input.icon),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ports: buildPorts(input.ports ?? DEFAULT_NODE_PORTS),
    stats: {
      speedMultiplier: input.speedMultiplier ?? 1,
      ...(input.powerConsumption !== undefined && { powerConsumption: input.powerConsumption }),
      ...(input.moduleSlots !== undefined && { moduleSlots: input.moduleSlots }),
      metadata: {},
    },
    metadata: {},
    tags: input.tags ?? [],
  };
  return { ...atlas, nodeTemplates: [...atlas.nodeTemplates, nodeTemplate] };
};

// ---- Recipes ----

export const addRecipe = (atlas: Atlas, input: AddRecipeInput): Atlas => {
  const id: RecipeId = recipeId(slugifyId(input.name, new Set(atlas.recipes.map((r) => r.id))));
  const recipe: Recipe = {
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
    metadata: {},
  };
  return { ...atlas, recipes: [...atlas.recipes, recipe] };
};
