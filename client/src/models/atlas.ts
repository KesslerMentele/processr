import type { AtlasId, ItemId, RecipeId, NodeTemplateId, CategoryId } from "./ids.ts";
import type { Metadata } from "./common.ts";
import type { Item, Category } from "./items.ts";
import type { Recipe } from "./recipes.ts";
import type { NodeTemplate } from "./nodes.ts";

export type SemVer = `${number}.${number}.${number}`;

/**
 * An Atlas is the complete static data package for a specific game.
 * It contains all items, recipes, node templates, categories, and metadata
 * needed to plan production for that game.
 *
 */
export interface Atlas {
  readonly id: AtlasId;
  readonly name: string;
  readonly gameName: string;
  readonly version: SemVer;
  readonly gameVersion?: string;
  readonly description?: string;
  readonly author?: string;
  readonly url?: string;

  readonly items: readonly Item[];
  readonly recipes: readonly Recipe[];
  readonly nodeTemplates: readonly NodeTemplate[];
  readonly categories: readonly Category[];

  readonly metadata: Metadata;
}

/**
 * Indexed/normalized form of an Atlas for efficient lookups.
 * Created at load time from the raw Atlas arrays. Not serialized.
 */
export interface AtlasIndex {
  readonly atlas: Atlas;
  readonly itemsById: ReadonlyMap<ItemId, Item>;
  readonly recipesById: ReadonlyMap<RecipeId, Recipe>;
  readonly nodeTemplatesById: ReadonlyMap<NodeTemplateId, NodeTemplate>;
  readonly categoriesById: ReadonlyMap<CategoryId, Category>;
  readonly recipesByNodeType: ReadonlyMap<NodeTemplateId, readonly Recipe[]>;
  readonly itemsByCategory: ReadonlyMap<CategoryId, readonly Item[]>;
}
