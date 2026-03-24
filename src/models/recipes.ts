import type { RecipeId, ItemId, NodeTemplateId, CategoryId } from "./ids.ts";
import type { DisplayInfo, Metadata, TimeUnit } from "./common.ts";

/** A single item stack in a recipe — item ID + amount per cycle. */
export interface RecipeItemStack {
  readonly itemId: ItemId;
  readonly amount: number;
}

/**
 * A Recipe defines a transformation: consume inputs, produce outputs,
 * over a duration, in a specific type of processor node.
 *
 * Recipes are definitions from the game pack. A ProcessorNode instance
 * references a recipe by ID.
 */
export interface Recipe {
  readonly id: RecipeId;
  readonly name: string;
  readonly display: DisplayInfo;
  readonly categoryId?: CategoryId;

  readonly inputs: readonly RecipeItemStack[];
  readonly outputs: readonly RecipeItemStack[];

  /**
   * Base duration of one recipe cycle.
   * Combined with a node's speed modifier, this determines actual throughput.
   */
  readonly duration: number;
  /** Defaults to "second" if omitted. */
  readonly durationUnit?: TimeUnit;

  /**
   * Which node template types can execute this recipe.
   * Empty/omitted means unconstrained (any node can use it).
   */
  readonly compatibleNodeTypes: readonly NodeTemplateId[];
  readonly compatibleNodeTags?: readonly string[];

  readonly metadata: Metadata;
}
