import type { GamePackIndex, Graph } from "../models";
import { getInputPorts, getOutputPorts } from "./node-utils.ts";
import { logger } from "./logger.ts";

export interface ConnectionQuery {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

const areItemsCompatible = (connection: Readonly<ConnectionQuery>, graph: Readonly<Graph>, packIndex: Readonly<GamePackIndex>): boolean => {
  const sourceNode = graph.nodes[connection.source];
  const targetNode = graph.nodes[connection.target];
  if (!sourceNode.recipeId || !targetNode.recipeId) { logger.debug('[isConnectionValid] one or both nodes have no recipe — items compatible by default'); return true; }

  const sourceRecipe = packIndex.recipesById.get(sourceNode.recipeId);
  const targetRecipe = packIndex.recipesById.get(targetNode.recipeId);
  if (!sourceRecipe || !targetRecipe) { logger.debug('[isConnectionValid] recipe lookup failed'); return true; }

  const srcIdx = getOutputPorts(packIndex.nodeTemplatesById.get(sourceNode.templateId)).findIndex(p => p.id === connection.sourceHandle);
  const tgtIdx = getInputPorts(packIndex.nodeTemplatesById.get(targetNode.templateId)).findIndex(p => p.id === connection.targetHandle);
  const srcItem = srcIdx >= 0 ? sourceRecipe.outputs[srcIdx]?.itemId : undefined;
  const tgtItem = tgtIdx >= 0 ? targetRecipe.inputs[tgtIdx]?.itemId : undefined;
  logger.debug(`[isConnectionValid] item check srcIdx=${String(srcIdx)} srcItem=${srcItem ?? 'none'} tgtIdx=${String(tgtIdx)} tgtItem=${tgtItem ?? 'none'}`);

  return !srcItem || !tgtItem || srcItem === tgtItem;
};

export const isConnectionValid = (connection: Readonly<ConnectionQuery>, graph: Readonly<Graph>, packIndex: Readonly<GamePackIndex>): boolean => {
  logger.debug(`[isConnectionValid] checking source=${connection.source}:${connection.sourceHandle ?? 'none'} → target=${connection.target}:${connection.targetHandle ?? 'none'}`);
  if (connection.source === connection.target) { logger.debug('[isConnectionValid] REJECT: self-loop'); return false; }
  if (Object.values(graph.edges).some(e =>
    e.sourceNodeId === connection.source &&
    e.targetNodeId === connection.target &&
    (e.sourcePortId ?? null) === (connection.sourceHandle ?? null) &&
    (e.targetPortId ?? null) === (connection.targetHandle ?? null)
  )) { logger.debug('[isConnectionValid] REJECT: duplicate edge'); return false; }
  return areItemsCompatible(connection, graph, packIndex);
};