import type {
  GamePackId,
  Graph,
  Metadata,
  NodeTemplate,
  Position,
  ProcessrNode,
} from "../models";
import { newGraphId, newProcessrNodeId } from "./id.ts";


const newViewport = () => ({ x: 0, y: 0, zoom: 1 });


type CreateProcessrNodeOptions = Partial<Omit<ProcessrNode, 'id' | 'templateId' | 'ports' | 'position' | 'metadata'>>

export const createProcessrNode = (
  template: NodeTemplate,
  position:Position,
  options?: CreateProcessrNodeOptions,
): ProcessrNode => {
  return {
    id: newProcessrNodeId(),
    templateId: template.id,
    position,
    recipeId: options?.recipeId ?? null,
    statsOverride: options?.statsOverride ?? { metadata: {} },
    ports: template.ports.map((p) => ({ id: p.id, definitionId: p.id })),
    count: options?.count ?? 1,
    metadata: template.metadata
  };
};

export const createGraph = (
  gamePackId: GamePackId,
  name:string
): Graph => {
  const now = new Date().toISOString();
  return {
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
};