import type {
  AtlasIndex,
  Edge,
  EdgeId,
  Graph,
  ItemId,
  PortInstance,
  ProcessrNodeId,
  RecipeId
} from "../models";
import { PortDirection, type ProcessrNode } from "../models";
import type { PortInstanceId } from "../models";
import { logger } from "./logger.ts";



/**
 * A map connecting a PortInstance to an item and its rate of production/consumption per second.
 */
type PortStats = Record<PortInstanceId, ItemStats>
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
 * Assigns each port an evenly-spaced 0..1 `renderPosition` along the node's edge,
 * based on its index in the given (already order-sorted) array — e.g. a single
 * port centers at 0.5; three ports land at 0.25/0.5/0.75. This is the actual
 * on-canvas placement; `PortTemplate.order` only decides the array's order.
 * @param ports
 */
export const withRenderPositions = (ports: readonly PortInstance[]): (PortInstance & { readonly renderPosition: number })[] =>
  ports.map((port, i) => ({ ...port, renderPosition: (i + 1) / (ports.length + 1) }));

/**
 * Recomputes the `stack` a node's ports should carry for a given recipe, resolving each
 * port's template from `portInstances` (the graph's port-instance record). Does not
 * change which port ids belong to the node — only the returned PortInstance data for
 * those ids, meant to be merged back into `graph.portInstances`.
 * @param node
 * @param recipeId
 * @param atlas
 * @param graph
 */
export const applyRecipeToPorts = (atlas: AtlasIndex, graph: Graph, node: ProcessrNode, recipeId: RecipeId | null,): readonly PortInstance[] => {
  const recipe = recipeId ? atlas.recipesById.get(recipeId) : null;
  if (!recipe) return node.ports.map(p => ({ id: p, template: graph.portInstances.get(p)?.template }));
  const inputPorts = getPorts(graph, node, PortDirection.Input);
  const outputPorts = getPorts(graph, node, PortDirection.Output);
  const stackByPortId = new Map(
    [...inputPorts.map((p, i) => [p.id, recipe.inputs[i]] as const),
     ...outputPorts.map((p, i) => [p.id, recipe.outputs[i]] as const)]
  );
  return node.ports.map(p => {
    const stack = stackByPortId.get(p);
    const template = graph.portInstances[p].template;
    return stack ? { id: p, template, stack } : { id: p, template };
  });
};

/**
 * Returns the ports of a given type associated with the ProcessrNode instance, sorted by position.
 * @param graph
 * @param instance - The ProcessrNode
 * @param type
 */
export const getPorts = (graph: Graph, instance: ProcessrNode, type: PortDirection): PortInstance[] => {
  return instance.ports.flatMap(p => {
    if (!Object.hasOwn(graph.portInstances, p)) {
      logger.warn(`[resolvePorts] node=${instance.id} references missing portInstance=${p} — graph.portInstances is out of sync`);
      return [];
    }
    return [graph.portInstances[p]];
  }).filter(pi => pi.template.direction === type).sort((a: PortInstance, b: PortInstance) => a.template.order - b.template.order);
};

/**
 * Takes a ProcessrNode and returns the InstanceRateStats containing all the inputs and output info for that node.
 * @param atlas - The atlas used for the graph
 * @param instance - The node being processed
 * @param graph - The graph the node belongs to
 */
export const getRates = (atlas: AtlasIndex, graph: Graph, instance: ProcessrNode): InstanceRateStats | undefined => {
  const nodeTemplate = atlas.nodeTemplatesById.get(instance.templateId);

  /**
   * Calculates the rate in items/second at which the given ports will output their items.
   *
   * Returned as a collection of portId -> {itemId: items/sec}
   *
   * @param ports - an array of PortInstances from a machine
   * @param speed - the speed at which the machine(s) processes one iteration of a recipe.
   */
  const constructRate = (ports: PortInstance[], speed: number): PortStats =>
    Object.fromEntries(ports.flatMap(p =>
      p.stack ? [[p.id, { [p.stack.itemId]: p.stack.amount * speed }]] : []
    )) as PortStats;


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
  const output = constructRate(getPorts(graph, instance, PortDirection.Output), speed);
  const input = constructRate(getPorts(graph, instance, PortDirection.Input), speed);

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
const getFloatingRates = (atlas:AtlasIndex, graph:Graph, instance: ProcessrNode): InstanceRateStats | undefined => {
  const getFloatingOutputPorts = (edges: Record<EdgeId, Edge>, nodes: Record<ProcessrNodeId, ProcessrNode>): PortInstanceId[] => {
    const fulfilledPorts = Array.from(Object.entries(edges).flatMap(([,e]) => [e.sourcePortId]));
    return Array.from(Object.entries(nodes).flatMap(([,node]) => node.ports).filter((p) => !fulfilledPorts.includes(p)));
  };

  const getFloatingInputPorts = (edges: Record<EdgeId, Edge>, nodes: Record<ProcessrNodeId, ProcessrNode>): PortInstanceId[] => {
    const fulfilledPorts = Array.from(Object.entries(edges).flatMap(([,e]) => [e.targetPortId]));
    return Array.from(Object.entries(nodes).flatMap(([,node]) => node.ports).filter((p) => !fulfilledPorts.includes(p)));
  };


  const floatingInputs = new Set(getFloatingInputPorts(graph.edges, graph.nodes));
    const floatingOutputs = new Set(getFloatingOutputPorts(graph.edges, graph.nodes));

    //have all floating ports, filter by ports on this node, then
    const instanceRates = getRates(atlas, graph, instance);
    if (!instanceRates) return;

    return {
      output: Object.fromEntries(Object.entries(instanceRates.output).filter(([id]) => floatingOutputs.has(id as PortInstanceId))),
      input: Object.fromEntries(Object.entries(instanceRates.input).filter(([id]) => floatingInputs.has(id as PortInstanceId)))
    };
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

  /**
   * Merges a given ports values into a passed itemStats, if applicable.
   * @param parentItemStats - The ItemStats to add to.
   * @param portStats - The Port being checked.
   */
  const mergeItemRates = (parentItemStats: ItemStats, portStats: PortStats): ItemStats =>
    Object.values(portStats).reduce((acc, itemStats) => {
      const overlappingKeys = Object.keys(acc).filter((k) => Object.hasOwn(itemStats, k));
      const sumOverlap = Object.fromEntries(overlappingKeys.map(k => [k, acc[k as ItemId] + itemStats[k as ItemId]]));
      return { ...acc, ...itemStats, ...sumOverlap };
    }, parentItemStats);


  // Merge every nodes stats into a full graph stats object.
  const result: GraphRateStats = stats.reduce((acc:Readonly<GraphRateStats>, cur) => ({
    input: mergeItemRates(acc.input, cur.input),
    output: mergeItemRates(acc.output, cur.output),
  }), { input:{},output:{} });
  logger.debug(`[getAllFloatingRates] inputs=${String(Object.keys(result.input).length)} outputs=${String(Object.keys(result.output).length)}`);
  return result;
};


export type PortRateData = Record<PortInstanceId, { stats: ItemStats; connectionCount: number }>;

/**
 * TODO: implements the N×M flow-balancing algorithm described in process-flow-stats.md.
 * Scaffold only — not yet wired up to any caller.
 * @param allEdges
 * @param graph
 * @param atlas
 */
export const balanceItemFlow = (allEdges: Edge[], _graph: Graph, atlas: AtlasIndex): PortRateData => {
  return createPortRateData(allEdges, atlas);
};

/**
 * TODO: build the initial portId -> {stats, connectionCount} map (see process-flow-stats.md).
 * @param edges
 * @param atlas
 */
export const createPortRateData = (edges: Edge[], atlas: AtlasIndex): PortRateData => {
  logger.debug(`[createPortRateData] not yet implemented — edges=${String(edges.length)} atlas=${atlas.atlas.id}`);
  return {};
};
