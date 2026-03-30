import type {
  Edge,
  GamePackId,
  Graph, ItemId,
  Metadata,
  NodeTemplate, PortId,
  Position,
  ProcessrNode, ProcessrNodeId,
} from "../models";
import { newEdgeId, newGraphId, newProcessrNodeId } from "./id.ts";

interface CreateEdgeOptions {
  readonly sourcePortId?: PortId;
  readonly targetPortId?: PortId;
  readonly itemId?: ItemId;
  readonly label?: string;
}


const newViewport = () => ({ x: 0, y: 0, zoom: 1 });


export const createProcessrNode = (
  template: NodeTemplate,
  position:Position
): ProcessrNode => {
  return {
    id: newProcessrNodeId(),
    templateId: template.id,
    position,
    recipeId: null,
    statsOverride: { metadata: {} },
    ports: template.ports.map((p) => ({ id: p.id, definitionId: p.id })),
    count: 1,
    metadata: template.metadata
  };
};

export const createEdge = (
  sourceNodeId: ProcessrNodeId,
  targetNodeId: ProcessrNodeId,
  options: CreateEdgeOptions
): Edge => {
  const base = {
   id: newEdgeId(),
   sourceNodeId,
   targetNodeId,
   itemId: options.itemId,
   label: options.label,
   metadata: {} as Metadata
  };

  return options.sourcePortId !== undefined && options.targetPortId !== undefined
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

