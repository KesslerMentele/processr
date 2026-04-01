import type { GamePackIndex, Graph } from "../models";
import { getInputPorts, getOutputPorts } from "./node-utils.ts";

export interface ConnectionQuery {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

const areItemsCompatible = (connection: Readonly<ConnectionQuery>, graph: Readonly<Graph>, packIndex: Readonly<GamePackIndex>): boolean => {
  const sourceNode = graph.nodes[connection.source];
  const targetNode = graph.nodes[connection.target];
  if (!sourceNode.recipeId || !targetNode.recipeId) return true;

  const sourceRecipe = packIndex.recipesById.get(sourceNode.recipeId);
  const targetRecipe = packIndex.recipesById.get(targetNode.recipeId);
  if (!sourceRecipe || !targetRecipe) return true;

  const srcIdx = getOutputPorts(packIndex.nodeTemplatesById.get(sourceNode.templateId)).findIndex(p => p.id === connection.sourceHandle);
  const tgtIdx = getInputPorts(packIndex.nodeTemplatesById.get(targetNode.templateId)).findIndex(p => p.id === connection.targetHandle);
  const srcItem = srcIdx >= 0 ? sourceRecipe.outputs[srcIdx]?.itemId : undefined;
  const tgtItem = tgtIdx >= 0 ? targetRecipe.inputs[tgtIdx]?.itemId : undefined;

  return !srcItem || !tgtItem || srcItem === tgtItem;
};

export const isConnectionValid = (connection: Readonly<ConnectionQuery>, graph: Readonly<Graph>, packIndex: Readonly<GamePackIndex>): boolean => {
  if (connection.source === connection.target) return false;
  if (Object.values(graph.edges).some(e =>
    e.sourceNodeId === connection.source &&
    e.targetNodeId === connection.target &&
    (e.sourcePortId ?? null) === (connection.sourceHandle ?? null) &&
    (e.targetPortId ?? null) === (connection.targetHandle ?? null)
  )) return false;
  return areItemsCompatible(connection, graph, packIndex);
};