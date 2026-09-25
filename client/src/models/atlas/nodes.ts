import type { NodeTemplateId, PortId, CategoryId } from "../ids.ts";
import type { DisplayInfo, Metadata } from "../common.ts";

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
export interface PortTemplate {
  readonly id: PortId;
  readonly name: string;
  readonly direction: PortDirection;
  /**
   * Author-assigned order among ports of the same direction on this template
   * (lower sorts first; ties break arbitrarily). Purely a sort key — it does
   * not itself place the port. The actual evenly-spaced on-node position is
   * computed at render time from this ordering (see `getInputPorts`/
   * `getOutputPorts` in node-utils.ts and `ProcessrNodeComponent`).
   */
  readonly order: number;
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
  readonly ports: readonly PortTemplate[];
  readonly stats: NodeStats;
  readonly metadata: Metadata;
  readonly tags: readonly string[];
}

export type AddNodeFunc = (template:NodeTemplate) => void;
