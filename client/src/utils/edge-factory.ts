import type { Edge, Metadata, PortId, ProcessrNodeId } from "../models";
import { newEdgeId } from "./id.ts";
import { getInputPorts, getOutputPorts } from "./node-utils.ts";
import { useBoundStore } from "../state/store.ts";

type CreateEdgeOptions = Partial<Pick<Edge, 'itemId' | 'label' | 'metadata'>>

/** Explicit port pair — use when you already know which ports to connect. */
interface EdgePortSpec { readonly sourcePortId: PortId; readonly targetPortId: PortId }

/**
 * Looks up the source and target nodes from the store, then picks the best
 * port pair top-down: prefers item-type matches when both nodes have recipes,
 * falls back to first output → first input otherwise.
 */
const resolvePortPair = (
  sourceNodeId: ProcessrNodeId,
  targetNodeId: ProcessrNodeId,
): EdgePortSpec => {
  const { graph, atlasIndex } = useBoundStore.getState();

  if (!Object.hasOwn(graph.nodes, sourceNodeId) || !Object.hasOwn(graph.nodes, targetNodeId)) {
    throw new Error(`createEdge: node not found (source=${sourceNodeId}, target=${targetNodeId})`);
  }
  const sourceNode = graph.nodes[sourceNodeId];
  const targetNode = graph.nodes[targetNodeId];

  const sourceTemplate = atlasIndex.nodeTemplatesById.get(sourceNode.templateId);
  const targetTemplate = atlasIndex.nodeTemplatesById.get(targetNode.templateId);
  if (!sourceTemplate || !targetTemplate) throw new Error(`createEdge: template not found for node`);

  const outputPorts = getOutputPorts(sourceTemplate);
  const inputPorts = getInputPorts(targetTemplate);
  if (outputPorts.length === 0 || inputPorts.length === 0) {
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

    if (match?.inPort) return { sourcePortId: match.outPort.id, targetPortId: match.inPort.id };
  }

  return { sourcePortId: outputPorts[0].id, targetPortId: inputPorts[0].id };
};

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
  sourceNodeId: ProcessrNodeId,
  targetNodeId: ProcessrNodeId,
  ports?: EdgePortSpec,
  options?: CreateEdgeOptions
): Edge => {
  const { sourcePortId, targetPortId } = ports ?? resolvePortPair(sourceNodeId, targetNodeId);
  return {
    id: newEdgeId(),
    sourceNodeId,
    targetNodeId,
    sourcePortId,
    targetPortId,
    itemId: options?.itemId,
    label: options?.label,
    metadata: options?.metadata ? options.metadata : {} as Metadata,
  };
};