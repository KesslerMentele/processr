import type {
  AtlasId,
  AtlasIndex,
  Graph,
  Metadata,
  NodeTemplate,
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
 * Creates a node instance from a template. When `options.recipeId` is set,
 * pass `atlas` so the ports are pre-populated with the recipe's item stacks
 * (via `applyRecipeToPorts`) — otherwise a recipe assigned at creation time
 * (e.g. auto-selected because it's the template's only compatible recipe)
 * leaves ports without a `stack`, and the stats panel silently ignores the node.
 */
export const createProcessrNode = (
  template: NodeTemplate,
  position:Position,
  options?: CreateProcessrNodeOptions,
  atlas?: AtlasIndex,
): ProcessrNode => {
  const id = newProcessrNodeId();
  const recipeId = options?.recipeId ?? null;
  const node = {
    id,
    templateId: template.id,
    position,
    recipeId,
    statsOverride: options?.statsOverride ?? { metadata: {} },
    ports: template.ports.map((p) => ({ id: portInstanceId(id + p.id), template: p })),
    count: options?.count ?? 1,
    metadata: template.metadata
  };
  const ports = recipeId && atlas ? applyRecipeToPorts(node, recipeId, atlas) : node.ports;
  logger.debug(`[createProcessrNode] id=${id} template=${template.id} pos=(${position.x.toString()},${position.y.toString()})`);
  return { ...node, ports };
};

export const cloneNode = (
  source: ProcessrNode,
  template: NodeTemplate,
  position: Position,
  atlas: AtlasIndex,
): ProcessrNode => {
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