import {edgeId, type EdgeId, graphId, type GraphId, processorNodeId, type ProcessorNodeId} from "../models";


export function newGraphId(): GraphId { return graphId(crypto.randomUUID()); }
export function newProcessorNodeId(): ProcessorNodeId { return processorNodeId(crypto.randomUUID()); }
export function newEdgeId(): EdgeId { return edgeId(crypto.randomUUID()); }