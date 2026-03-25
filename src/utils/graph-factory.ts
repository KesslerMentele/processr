import type {
  Edge,
  GamePackId,
  Graph,
  ItemId,
  Metadata,
  NodeTemplate,
  PortId,
  Position,
  ProcessorNode,
  ProcessorNodeId
} from "../models";
import {newEdgeId, newGraphId, newProcessorNodeId} from "./id.ts";

interface CreateEdgeOptions {
  readonly sourcePortId?: PortId;
  readonly targetPortId?: PortId;
  readonly itemId?: ItemId;
  readonly label?: string;
}


const newViewport = () => ({ x: 0, y: 0, zoom: 1 });


export const createProcessorNode = (
  template: NodeTemplate,
  position:Position
): ProcessorNode => {
  return {
    id: newProcessorNodeId(),
    templateId: template.id,
    position,
    recipeId: null,
    statsOverride: {metadata: {}},
    ports: [],
    count: 0,
    metadata: template.metadata
  }
}

export const createEdge = (
  sourceNodeId: ProcessorNodeId,
  targetNodeId: ProcessorNodeId,
  options: CreateEdgeOptions
): Edge => {
  const base = {
   id: newEdgeId(),
   sourceNodeId,
   targetNodeId,
   itemId: options.itemId,
   label: options.label,
   metadata: {} as Metadata
  }

  return options.sourcePortId !== undefined && options.targetPortId !== undefined
  ? {...base, sourcePortId:options.sourcePortId, targetPortId: options.targetPortId}
  : { ...base };
}

export const createGraph = (
  gamePackId: GamePackId,
  name:string
): Graph => {
  const now = new Date().toISOString();
  return {
    id: newGraphId(),
    name,
    gamePackId,
    nodes: [],
    edges: [],
    viewport: newViewport(),
    createdAt: now,
    updatedAt: now,
    metadata: {} as Metadata,
  }
}

