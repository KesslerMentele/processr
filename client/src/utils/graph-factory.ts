import type {
  AtlasId,
  Graph,
  Metadata,
  NodeTemplate,
  Position,
  ProcessrNode,
} from "../models";
import { newGraphId, newProcessrNodeId } from "./id.ts";
import { portInstanceId } from "../models/ids.ts";
import { logger } from "./logger.ts";

const newViewport = () => ({ x: 0, y: 0, zoom: 1 });


type CreateProcessrNodeOptions = Partial<Omit<ProcessrNode, 'id' | 'templateId' | 'ports' | 'position' | 'metadata'>>

export const createProcessrNode = (
  template: NodeTemplate,
  position:Position,
  options?: CreateProcessrNodeOptions,
): ProcessrNode => {
  const id = newProcessrNodeId();
  const node = {
    id,
    templateId: template.id,
    position,
    recipeId: options?.recipeId ?? null,
    statsOverride: options?.statsOverride ?? { metadata: {} },
    ports: template.ports.map((p) => ({ id: portInstanceId(id + p.id), template: p })),
    count: options?.count ?? 1,
    metadata: template.metadata
  };
  logger.debug(`[createProcessrNode] id=${id} template=${template.id} pos=(${position.x},${position.y})`);
  return node;
};

export const cloneNode = (
  source: ProcessrNode,
  template: NodeTemplate,
  position: Position,
): ProcessrNode => {
  logger.debug(`[cloneNode] source=${source.id} template=${template.id}`);
  return createProcessrNode(template, position, {
    recipeId: source.recipeId,
    statsOverride: source.statsOverride,
    label: source.label,
    count: 1,
  });
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