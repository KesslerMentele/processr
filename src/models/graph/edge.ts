import type { EdgeId, ProcessorNodeId, PortId, ItemId } from "../ids.ts";
import type { Metadata } from "../common.ts";

/** Fields shared by all edge variants. */
interface EdgeBase {
  readonly id: EdgeId;
  readonly sourceNodeId: ProcessorNodeId;
  readonly targetNodeId: ProcessorNodeId;
  /**
   * The item being transported. Optional — can be inferred from the
   * source node's recipe output. Explicit when a node produces
   * multiple outputs and disambiguation is needed.
   */
  readonly itemId?: ItemId;
  readonly label?: string;
  readonly metadata: Metadata;
}

/**
 * Node-level edge: connects two nodes without specifying ports.
 * The default mode — sufficient when nodes have a single input/output.
 */
type EdgeNodeLevel = EdgeBase & {
  readonly sourcePortId?: never;
  readonly targetPortId?: never;
};

/**
 * Port-level edge: connects specific named ports on each node.
 * Required when a node has multiple ports and routing must be explicit.
 */
type EdgePortLevel = EdgeBase & {
  readonly sourcePortId: PortId;
  readonly targetPortId: PortId;
};

/**
 * An Edge represents a connection between two processor nodes,
 * indicating that items flow from one node's output to another's input.
 *
 * Uses a discriminated union to prevent the invalid state of having
 * only one port ID set. Either both ports are specified or neither is.
 *
 * ReactFlow compatibility:
 *   Edge.source       -> Edge.sourceNodeId
 *   Edge.target       -> Edge.targetNodeId
 *   Edge.sourceHandle -> Edge.sourcePortId
 *   Edge.targetHandle -> Edge.targetPortId
 */
export type Edge = EdgeNodeLevel | EdgePortLevel;
