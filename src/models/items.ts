import type { ItemId, CategoryId } from "./ids.ts";
import type { DisplayInfo, Metadata } from "./common.ts";

/**
 * An Item is anything that can appear as an input or output of a recipe.
 * Examples: Iron Ore, Iron Plate, Copper Wire, Water, Electricity.
 *
 * Items are definitions — they live in the game pack and are immutable.
 * They do NOT carry rate/throughput data; that comes from recipes
 * and the graph solver.
 */
export interface Item {
  readonly id: ItemId;
  readonly name: string;
  readonly display: DisplayInfo;
  readonly categoryId?: CategoryId;
  /**
   * Physical form of this item. Affects transport constraints
   * (belts vs. pipes) in games that distinguish this.
   */
  readonly form?: ItemForm;
  readonly metadata: Metadata;
}

/** Physical form/phase of an item. */
export const ItemForm = {
  Solid: "solid",
  Fluid: "fluid",
  Gas: "gas",
  Energy: "energy",
} as const;

export type ItemForm = (typeof ItemForm)[keyof typeof ItemForm];

/** A grouping category for items, recipes, and node templates. */
export interface Category {
  readonly id: CategoryId;
  readonly name: string;
  readonly display: DisplayInfo;
  readonly sortOrder?: number;
  readonly parentId?: CategoryId;
}
