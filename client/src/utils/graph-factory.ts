import type {
  AtlasId,
  Graph,
  Metadata,
} from "../models";
import { newGraphId } from "./graph-utils.ts";

import { logger } from "./logger.ts";

const newViewport = () => ({ x: 0, y: 0, zoom: 1 });

export const createGraph = (
  gamePackId: AtlasId,
  name:string
): Graph => {
  const now = new Date().toISOString();
  const graph: Graph = {
    id: newGraphId(),
    name,
    gamePackId,
    nodes: new Map(),
    portInstances: new Map(),
    edges: new Map(),
    viewport: newViewport(),
    history: { past: [], future: [] },
    createdAt: now,
    updatedAt: now,
    metadata: {} as Metadata,
  };
  logger.info(`[createGraph] id=${graph.id} name="${name}" gamePackId=${gamePackId}`);
  return graph;
};