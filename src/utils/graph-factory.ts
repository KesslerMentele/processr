import type {
  Edge,
  GamePackId,
  Graph,
  Metadata,
  NodeTemplate,
  Position,
  ProcessrNode, ProcessrNodeId,
} from "../models";
import { newEdgeId, newGraphId, newProcessrNodeId } from "./id.ts";


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

type CreateEdgeOptions = Partial<Pick<Edge, 'itemId' | 'label' | 'metadata' | 'sourcePortId' | 'targetPortId' >>

export const createEdge = (
  sourceNodeId: ProcessrNodeId,
  targetNodeId: ProcessrNodeId,
  options?: CreateEdgeOptions
): Edge => {
  const base = {
   id: newEdgeId(),
   sourceNodeId,
   targetNodeId,
   itemId: options?.itemId,
   label: options?.label,
   metadata: options?.metadata ? options.metadata : {} as Metadata,
  };
  if ((options?.sourcePortId && options.targetPortId === undefined) || (options?.targetPortId && options.sourcePortId === undefined)) {
    throw new Error('You must provide either both source and target port, or neither');
  }
  return options?.sourcePortId !== undefined && options.targetPortId !== undefined
  ? { ...base, sourcePortId:options.sourcePortId, targetPortId: options.targetPortId }
  : { ...base };
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

