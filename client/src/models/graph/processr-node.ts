import type {
  ProcessrNodeId,
  NodeTemplateId,
  RecipeId,
  PortInstanceId,
} from "../ids.ts";
import type { Position, Metadata } from "../common.ts";
import type { Item } from "../items.ts";
import type { RecipeItemStack } from "../recipes.ts";
import type { PortTemplate } from "../nodes.ts";



/**
 * User-overridden stats for a specific node instance.
 * Only fields the user has changed are present; everything else
 * falls back to the template's base stats.
 */
export interface NodeStatsOverride {
  readonly speedMultiplier?: number;
  readonly powerConsumption?: number;
  readonly moduleSlots?: number;
  readonly metadata: Metadata;
}

/**
 * A ProcessorNode is a user-placed instance of a NodeTemplate on the canvas.
 * It references its template by ID and can override stats, assign a recipe,
 * set a label, etc.
 */
export interface ProcessrNode {
  readonly id: ProcessrNodeId;
  readonly templateId: NodeTemplateId;
  /** User-assigned label. Falls back to the template name if not set. */
  readonly label?: string;
  readonly position: Position;
  /** The Currently assigned recipe. Null if no recipe is set. */
  readonly recipeId: RecipeId | null;
  readonly statsOverride: NodeStatsOverride;
  readonly ports: readonly PortInstance[];
  /** How many of this machine run in parallel. Defaults to 1. */
  readonly count: number;
  readonly metadata: Metadata;
}


/**
 * A port instance on a placed processor node.
 * Created from the template's PortDefinition when the node is instantiated.
 */
export interface PortInstance {
  readonly id: PortInstanceId;
  readonly template: PortTemplate;
  readonly item?: Item;
  readonly stack?: RecipeItemStack;
}