import { type AtlasIndex, type Edge, type Graph, type Metadata, PortDirection, type ProcessrNodeId } from "../models";
import { getPorts } from "./node-utils.ts";
import type { PortInstanceId } from "../models";
import { logger } from "./logger.ts";
import { newEdgeId } from "./graph-utils.ts";

type CreateEdgeOptions = Partial<Pick<Edge, 'itemId' | 'label' | 'metadata'>>

/** Explicit port pair — use when you already know which ports to connect. */
interface EdgePortSpec { readonly sourcePortId: PortInstanceId; readonly targetPortId: PortInstanceId }



/**
 * Creates an edge between two nodes.
 *
 * When `ports` is omitted the function reads the current graph and atlas from
 * the store and resolves the best port pair automatically: it prefers an
 * item-type match (top-down) when both nodes have recipes, and falls back to
 * first output → first input otherwise.
 *
 * Pass `ports` explicitly when you already know the port IDs (e.g. when
 * converting a React Flow connection event).
 */
export const createEdge = (
  graph: Graph,
  atlasIndex: AtlasIndex,
  sourceNodeId: ProcessrNodeId,
  targetNodeId: ProcessrNodeId,
  ports?: EdgePortSpec,
  options?: CreateEdgeOptions,
): Edge => {

  /**
   * Looks up the source and target nodes in the provided graph, then picks the best
   * port pair top-down: prefers item-type matches when both nodes have recipes,
   * falls back to first output → first input otherwise.
   */
  const resolvePortPair = (
    sourceNodeId: ProcessrNodeId,
    targetNodeId: ProcessrNodeId,
  ): EdgePortSpec => {

    const sourceNode = graph.nodes.get(sourceNodeId);
    const targetNode = graph.nodes.get(targetNodeId);
    if (!sourceNode|| !targetNode) {
      logger.error(`[resolvePortPair] node not found — source=${sourceNodeId} target=${targetNodeId}`);
      throw new Error(`createEdge: node not found (source=${sourceNodeId}, target=${targetNodeId})`);
    }
    const sourceTemplate = atlasIndex.nodeTemplatesById.get(sourceNode.templateId);
    const targetTemplate = atlasIndex.nodeTemplatesById.get(targetNode.templateId);
    if (!sourceTemplate || !targetTemplate) {
      logger.error(`[resolvePortPair] template not found — source=${sourceNode.templateId} target=${targetNode.templateId}`);
      throw new Error(`createEdge: template not found for node`);
    }

    const outputPorts = getPorts(graph, sourceNode, PortDirection.Output);
    const inputPorts = getPorts(graph, targetNode, PortDirection.Input);
    if (outputPorts.length === 0 || inputPorts.length === 0) {
      logger.error(`[resolvePortPair] no connectable ports — sourceOutputs=${outputPorts.length.toString()} targetInputs=${inputPorts.length.toString()}`);
      throw new Error(`createEdge: no connectable ports (source outputs=${String(outputPorts.length)}, target inputs=${String(inputPorts.length)})`);
    }

    const sourceRecipe = sourceNode.recipeId ? atlasIndex.recipesById.get(sourceNode.recipeId) : undefined;
    const targetRecipe = targetNode.recipeId ? atlasIndex.recipesById.get(targetNode.recipeId) : undefined;

    if (sourceRecipe && targetRecipe) {
      const match = outputPorts
      .map((outPort, outIdx) => ({
        outPort,
        inPort: inputPorts.find((_, inIdx) => targetRecipe.inputs[inIdx]?.itemId === sourceRecipe.outputs[outIdx]?.itemId),
      }))
      .find(({ inPort }) => inPort !== undefined);

      if (match?.inPort) {
        logger.debug(`[resolvePortPair] item match — src=${match.outPort.id} tgt=${match.inPort.id}`);
        return { sourcePortId: match.outPort.id, targetPortId: match.inPort.id };
      }
    }

    logger.debug(`[resolvePortPair] no item match — falling back to first ports src=${outputPorts[0].id} tgt=${inputPorts[0].id}`);
    return { sourcePortId: outputPorts[0].id, targetPortId: inputPorts[0].id };
  };

  const { sourcePortId, targetPortId } = ports ?? resolvePortPair(sourceNodeId, targetNodeId);
  const edge = {
    id: newEdgeId(),
    sourceNodeId,
    targetNodeId,
    sourcePortId,
    targetPortId,
    itemId: options?.itemId,
    label: options?.label,
    metadata: options?.metadata ? options.metadata : {} as Metadata,
  };
  logger.debug(`[createEdge] id=${edge.id} ${sourceNodeId}:${sourcePortId} → ${targetNodeId}:${targetPortId}`);
  return edge;
};