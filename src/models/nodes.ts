import type {NodeTemplateId, PortId, CategoryId} from "./ids.ts";
import type { DisplayInfo, Metadata } from "./common.ts";

/** Direction of a port on a node template. */
export const PortDirection = {
  Input: "input",
  Output: "output",
} as const;

export type PortDirection = (typeof PortDirection)[keyof typeof PortDirection];

/**
 * A port definition on a node template. Ports are connection points
 * where edges attach.
 *
 * In the simplest model, a node has one input and one output port.
 * More complex nodes (e.g., Satisfactory Manufacturer with 4 input slots)
 * have multiple named ports.
 */
export interface PortDefinition {
  readonly id: PortId;
  readonly name: string;
  readonly direction: PortDirection;
  /** Visual position hint (0.0 = top/left, 1.0 = bottom/right). */
  readonly position?: number;
  readonly metadata: Metadata;
}

/**
 * Base statistics for a node template type.
 * User instances can override these via NodeStatsOverride.
 */
export interface NodeStats {
  /** Base crafting speed multiplier (1.0 = normal). */
  readonly speedMultiplier: number;
  readonly powerConsumption?: number;
  readonly moduleSlots?: number;
  readonly metadata: Metadata;
}

/**
 * A NodeTemplate is the definition of a processor type from a game pack.
 * Examples: "Electric Furnace", "Assembling Machine Mk.3", "Constructor".
 *
 * When a user places a node on the canvas, they create a ProcessorNode
 * instance that references a NodeTemplate by ID.
 */
export interface NodeTemplate {
  readonly id: NodeTemplateId;
  readonly name: string;
  readonly display: DisplayInfo;
  readonly categoryId?: CategoryId;
  readonly ports: readonly PortDefinition[];
  readonly stats: NodeStats;
  readonly metadata: Metadata;
  readonly tags: readonly string[];
}

export type AddNodeFunc = (template:NodeTemplate) => void;
