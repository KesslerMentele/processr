import type { AtlasIndex, Edge, EdgeId, Graph, ItemId, ProcessrNodeId } from "../models";
import { PortDirection, type PortInstance, type ProcessrNode } from "../models";
import type { PortInstanceId } from "../models/ids.ts";
import { logger } from "./logger.ts";

interface RateStats {
  itemId: ItemId;
  rate: number;
}

type PortStats = Record<PortInstanceId, RateStats>
type ItemStats = Record<ItemId, number>

interface InstanceRateStats {
  input: PortStats,
  output: PortStats
}

interface GraphRateStats {
  input: ItemStats,
  output: ItemStats
}

const byPosition = (a: PortInstance, b: PortInstance) => (a.template.position ?? 0.5) - (b.template.position ?? 0.5);

export const getInputPorts = (instance: ProcessrNode): PortInstance[] =>
   [...instance.ports.filter(p => p.template.direction === PortDirection.Input)].sort(byPosition);

export const getOutputPorts = (instance: ProcessrNode): PortInstance[] =>
  [...instance.ports.filter(p => p.template.direction === PortDirection.Output)].sort(byPosition);


const constructRate = (ports: PortInstance[], speed: number): PortStats =>
  Object.fromEntries(ports.flatMap(p => {
    if (p.stack) return [[p.id, { itemId: p.stack.itemId, rate: p.stack.amount * speed }]];
    if (!p.item) return [];
    return [[p.id, { itemId: p.item.id, rate: speed }]];
  })) as PortStats;

/*
All ratios are calculated in items/second.
 */
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
  const speed = recipe.duration * (nodeTemplate.stats.speedMultiplier + (instance.statsOverride.speedMultiplier ?? 0));
  logger.debug(`[getRates] node=${instance.id} recipe=${instance.recipeId} speed=${String(speed)}`);
  const output = constructRate(getOutputPorts(instance), speed);
  const input = constructRate(getInputPorts(instance), speed);

  return { output, input };
};

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

const mergeItemRates = (outerAcc:ItemStats, portStats:PortStats): ItemStats => {
  return Object.values(portStats).reduce((innerAcc, { itemId, rate }) => {
    return {
      ...innerAcc,
      [itemId]: (innerAcc[itemId] ?? 0) + rate
    };
  },outerAcc);
};

export const getAllFloatingRates = (atlas:AtlasIndex, graph:Graph): GraphRateStats => {
  const nodeCount = Object.keys(graph.nodes).length;
  logger.debug(`[getAllFloatingRates] computing over ${String(nodeCount)} nodes`);
  const stats = Object.entries(graph.nodes).flatMap(([,node]) => getFloatingRates(atlas, graph, node) ?? []);
  const result = stats.reduce((acc,cur) => ({
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