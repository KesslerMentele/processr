import {
  type AtlasIndex, type Graph,
  type NodeTemplate,
  type NodeWithPorts,
  type PortInstance, portInstanceId,
  type Position,
  type ProcessrNode
} from "../models";
import { applyPortInstances, newProcessrNodeId } from "./graph-utils.ts";
import { logger } from "./logger.ts";
import { applyRecipeToPorts } from "./node-utils.ts";

type CreateProcessrNodeOptions = Partial<Omit<ProcessrNode, 'id' | 'templateId' | 'ports' | 'position' | 'metadata'>>

export const createProcessrNode = (
  atlas: AtlasIndex,
  graph: Graph,
  template: NodeTemplate,
  position:Position,
  options?: CreateProcessrNodeOptions,
): NodeWithPorts => {
  const id = newProcessrNodeId();
  const recipeId = options?.recipeId ?? null;
  const basePorts: PortInstance[] = template.ports.map((p) => ({ id: portInstanceId(id + p.id), template: p }));
  const node: ProcessrNode = {
    id,
    templateId: template.id,
    position,
    recipeId,
    statsOverride: options?.statsOverride ?? { metadata: {} },
    ports: basePorts.map(p => p.id),
    count: options?.count ?? 1,
    metadata: template.metadata
  };
  const resolvedPorts = recipeId ? applyRecipeToPorts(atlas, applyPortInstances(graph, basePorts), node, recipeId) : basePorts;
  logger.debug(`[createProcessrNode] id=${id} template=${template.id} pos=(${position.x.toString()},${position.y.toString()})`);
  return { node, portInstances: new Map(resolvedPorts.map(p => [p.id, p])) };
};

export const cloneNode = (
  atlas: AtlasIndex,
  graph: Graph,
  source: ProcessrNode,
  template: NodeTemplate,
  position: Position,
): NodeWithPorts => {
  logger.debug(`[cloneNode] source=${source.id} template=${template.id}`);
  return createProcessrNode(atlas, graph, template, position, {
    recipeId: source.recipeId,
    statsOverride: source.statsOverride,
    label: source.label,
    count: 1,
  });
};
