import type {
  AtlasId,
  AtlasIndex,
  Graph,
  Metadata,
  NodeTemplate,
  NodeWithPorts,
  PortInstance,
  Position,
  ProcessrNode,
} from "../models";
import { newGraphId, newProcessrNodeId } from "./id.ts";
import { portInstanceId } from "../models/ids.ts";
import { applyRecipeToPorts } from "./node-utils.ts";
import { logger } from "./logger.ts";

const newViewport = () => ({ x: 0, y: 0, zoom: 1 });


type CreateProcessrNodeOptions = Partial<Omit<ProcessrNode, 'id' | 'templateId' | 'ports' | 'position' | 'metadata'>>

/**
 * Creates a node instance from a template, along with the PortInstance records
 * it references. When `options.recipeId` is set, pass `atlas` so the ports are
 * pre-populated with the recipe's item stacks (via `applyRecipeToPorts`) —
 * otherwise a recipe assigned at creation time (e.g. auto-selected because
 * it's the template's only compatible recipe) leaves ports without a `stack`,
 * and the stats panel silently ignores the node.
 *
 * The caller is responsible for merging both `node` and `portInstances` into
 * the graph (e.g. via the `addNode` action).
 */
export const createProcessrNode = (
  template: NodeTemplate,
  position:Position,
  options?: CreateProcessrNodeOptions,
  atlas?: AtlasIndex,
): NodeWithPorts => {
  const id = newProcessrNodeId();
  const recipeId = options?.recipeId ?? null;
  const basePorts: PortInstance[] = template.ports.map((p) => ({ id: portInstanceId(id + p.id), template: p }));
  const basePortsById = Object.fromEntries(basePorts.map(p => [p.id, p] as const));
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
  const resolvedPorts = recipeId && atlas ? applyRecipeToPorts(node, recipeId, atlas, basePortsById) : basePorts;
  logger.debug(`[createProcessrNode] id=${id} template=${template.id} pos=(${position.x.toString()},${position.y.toString()})`);
  return { node, portInstances: Object.fromEntries(resolvedPorts.map(p => [p.id, p] as const)) };
};

export const cloneNode = (
  source: ProcessrNode,
  template: NodeTemplate,
  position: Position,
  atlas: AtlasIndex,
): NodeWithPorts => {
  logger.debug(`[cloneNode] source=${source.id} template=${template.id}`);
  return createProcessrNode(template, position, {
    recipeId: source.recipeId,
    statsOverride: source.statsOverride,
    label: source.label,
    count: 1,
  }, atlas);
};

export const createGraph = (
  gamePackId: AtlasId,
  name:string
): Graph => {
  const now = new Date().toISOString();
  const graph = {
    id: newGraphId(),
    name,
    gamePackId,
    nodes: {},
    portInstances: {},
    edges: {},
    viewport: newViewport(),
    history: { past: [], future: [] },
    createdAt: now,
    updatedAt: now,
    metadata: {} as Metadata,
  };
  logger.info(`[createGraph] id=${graph.id} name="${name}" gamePackId=${gamePackId}`);
  return graph;
};