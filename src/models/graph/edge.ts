import type { EdgeId, ProcessorNodeId, PortId, ItemId } from "../ids.ts";
import type { Metadata } from "../common.ts";

/**
 * An Edge represents a connection between two processor nodes,
 * indicating that items flow from one node's output to another's input.
 *
 * Port fields are optional to allow both simple (node-to-node) and
 * detailed (port-to-port) connection modes. The system can start
 * with node-to-node edges and refine to port-based routing later.
 *
 * ReactFlow compatibility:
 *   Edge.source       -> Edge.sourceNodeId
 *   Edge.target       -> Edge.targetNodeId
 *   Edge.sourceHandle -> Edge.sourcePortId
 *   Edge.targetHandle -> Edge.targetPortId
 */
export interface Edge {
  readonly id: EdgeId;
  readonly sourceNodeId: ProcessorNodeId;
  readonly targetNodeId: ProcessorNodeId;
  readonly sourcePortId?: PortId;
  readonly targetPortId?: PortId;
  /**
   * The item being transported. Optional — can be inferred from the
   * source node's recipe output. Explicit when a node produces
   * multiple outputs and disambiguation is needed.
   */
  readonly itemId?: ItemId;
  readonly label?: string;
  readonly metadata: Metadata;
}
