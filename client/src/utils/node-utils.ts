import type { AtlasIndex, Edge, EdgeId, Graph, ItemId, ProcessrNodeId, RecipeId } from "../models";
import { PortDirection, type PortInstance, type ProcessrNode } from "../models";
import type { PortInstanceId } from "../models/ids.ts";
import { logger } from "./logger.ts";

/**
 * An interface containing an itemId and a rate in items/second.
 */
interface RateStats {
  itemId: ItemId;
  rate: number;
}


/**
 * A map connecting a PortInstance to an item and its rate of production/consumption per second.
 */
type PortStats = Record<PortInstanceId, RateStats>
type ItemStats = Record<ItemId, number>

/**
 * An interface containing the stats for all input and output ports for a given ProcessrNode instance.
 */
interface InstanceRateStats {
  input: PortStats,
  output: PortStats
}

/**
 * An interface containing the sum of all floating (not connected to an edge) input/output rates, in items per second
 */
interface GraphRateStats {
  input: ItemStats,
  output: ItemStats
}

/**
 *  A sort function to organize ports in the order they will be displayed.
 * @param a
 * @param b
 */
const byPosition = (a: PortInstance, b: PortInstance) => (a.template.position ?? 0.5) - (b.template.position ?? 0.5);

export const applyRecipeToPorts = (node: ProcessrNode, recipeId: RecipeId | null, atlas: AtlasIndex): readonly PortInstance[] => {
  const recipe = recipeId ? atlas.recipesById.get(recipeId) : null;
  if (!recipe) return node.ports.map(p => ({ id: p.id, template: p.template }));
  const inputPorts = getInputPorts(node);
  const outputPorts = getOutputPorts(node);
  const stackByPortId = new Map(
    [...inputPorts.map((p, i) => [p.id, recipe.inputs[i]] as const),
     ...outputPorts.map((p, i) => [p.id, recipe.outputs[i]] as const)]
  );
  return node.ports.map(p => {
    const stack = stackByPortId.get(p.id);
    return stack ? { id: p.id, template: p.template, stack } : { id: p.id, template: p.template };
  });
};

/**
 * Returns the input ports of a given ProcessrNode component, sorted by position.
 * @param instance
 */
export const getInputPorts = (instance: ProcessrNode): PortInstance[] =>
   [...instance.ports.filter(p => p.template.direction === PortDirection.Input)].sort(byPosition);

/**
 * Returns the output ports of a given ProcessrNode component, sorted by position.
 * @param instance
 */
export const getOutputPorts = (instance: ProcessrNode): PortInstance[] =>
  [...instance.ports.filter(p => p.template.direction === PortDirection.Output)].sort(byPosition);


const constructRate = (ports: PortInstance[], speed: number): PortStats =>
  Object.fromEntries(ports.flatMap(p =>
    p.stack ? [[p.id, { itemId: p.stack.itemId, rate: p.stack.amount * speed }]] : []
  )) as PortStats;

export const getRates = (atlas: AtlasIndex, instance: ProcessrNode): InstanceRateStats | undefined => {
  const nodeTemplate = atlas.nodeTemplatesById.get(instance.templateId);

  if (!instance.recipeId) {
    logger.debug(`[getRates] node=${instance.id} has no recipe — skipping`);
    return;
  }
  const recipe = atlas.recipesById.get(instance.recipeId);

  if (!nodeTemplate || !recipe) {
    logger.warn(`[getRates] node=${instance.id} missing ${nodeTemplate ? 'recipe' : 'template'} — skipping`);
    return;
  }
  const speed = (instance.statsOverride.speedMultiplier ?? nodeTemplate.stats.speedMultiplier) / recipe.duration * instance.count;
  logger.debug(`[getRates] node=${instance.id} recipe=${instance.recipeId} speed=${String(speed)} count=${String(instance.count)}`);
  const output = constructRate(getOutputPorts(instance), speed);
  const input = constructRate(getInputPorts(instance), speed);

  return { output, input };
};

/**
 *  Calculates the item rates of all ports that have no connected edges on a given node instance.
 *
 *  **!!**
 *  This does not account for the actual production/consumption of items at the other end of the connections,
 *  solely ports with *no* connections
 *  **!!**
 * @param atlas - The atlas being used for the graph
 * @param graph - The graph being displayed
 * @param instance - The node being processed
 */
export const getFloatingRates = (atlas:AtlasIndex, graph:Graph, instance: ProcessrNode): InstanceRateStats | undefined => {
    const floatingInputs = new Set(getFloatingInputPorts(graph.edges, graph.nodes).map(p => p.id));
    const floatingOutputs = new Set(getFloatingOutputPorts(graph.edges, graph.nodes).map(p => p.id));

    //have all floating ports, filter by ports on this node, then
    const instanceRates = getRates(atlas, instance);
    if (!instanceRates) return;

    return {
      output: Object.fromEntries(Object.entries(instanceRates.output).filter(([id]) => floatingOutputs.has(id as PortInstanceId))),
      input: Object.fromEntries(Object.entries(instanceRates.input).filter(([id]) => floatingInputs.has(id as PortInstanceId)))
    };
};

/**
 * Merges a given ports values into a passed itemStats, if applicable.
 * @param outerAcc - The ItemStats to add to.
 * @param portStats - The Port being checked.
 */
const mergeItemRates = (outerAcc:ItemStats, portStats:PortStats): ItemStats => {
  return Object.values(portStats).reduce((innerAcc, { itemId, rate }) => {
    return {
      ...innerAcc,
      [itemId]: (innerAcc[itemId] ?? 0) + rate
    };
  },outerAcc);
};

/**
 *  Calculates the item rates of all ports that have no connected edges on a given graph.
 *
 *  **!!**
 *  This does not account for the actual production/consumption of items at the other end of the connections,
 *  solely ports with *no* connections
 *  **!!**
 *
 * @param atlas - The atlas being used for the graph
 * @param graph - The graph being displayed
 */
export const getAllFloatingRates = (atlas:AtlasIndex, graph:Graph): GraphRateStats => {
  const nodeCount = Object.keys(graph.nodes).length;
  logger.debug(`[getAllFloatingRates] computing over ${String(nodeCount)} nodes`);
  const stats = Object.entries(graph.nodes).flatMap(([,node]) => getFloatingRates(atlas, graph, node) ?? []);

  // Merge every nodes stats into a full graph stats object.
  const result: GraphRateStats = stats.reduce((acc:Readonly<GraphRateStats>, cur) => ({
    input: mergeItemRates(acc.input, cur.input),
    output: mergeItemRates(acc.output, cur.output),
  }), { input:{},output:{} });
  logger.debug(`[getAllFloatingRates] inputs=${String(Object.keys(result.input).length)} outputs=${String(Object.keys(result.output).length)}`);
  return result;
};

export const getFloatingOutputPorts = (edges: Record<EdgeId, Edge>, nodes: Record<ProcessrNodeId, ProcessrNode>): PortInstance[] => {
  const fulfilledPorts = Array.from(Object.entries(edges).flatMap(([,e]) => [e.sourcePortId]));
  return Array.from(Object.entries(nodes).flatMap(([,node]) => node.ports).filter((p) => !fulfilledPorts.includes(p.id)));
};

export const getFloatingInputPorts = (edges: Record<EdgeId, Edge>, nodes: Record<ProcessrNodeId, ProcessrNode>): PortInstance[] => {
  const fulfilledPorts = Array.from(Object.entries(edges).flatMap(([,e]) => [e.targetPortId]));
  return Array.from(Object.entries(nodes).flatMap(([,node]) => node.ports).filter((p) => !fulfilledPorts.includes(p.id)));
};