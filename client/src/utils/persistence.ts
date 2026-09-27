import type { Atlas, Edge, EdgeId, Graph, PortInstance, PortInstanceId, ProcessrNode, ProcessrNodeId } from "../models";
import { DOCUMENT_FORMAT_VERSION } from "../models";
import { logger } from "./logger.ts";

const GRAPH_KEY = "processr:graph";

const serializeMap = <K, V>(map: ReadonlyMap<K, V>):string => {
  return JSON.stringify(Object.fromEntries(map));
};

const deserializeMap = <K extends string, V>(json: string): ReadonlyMap<K, V> => {
  const record = JSON.parse(json) as Record<K, V>;
  return new Map(Object.entries(record) as [K, V][]);
};

/**
 * On-disk shape of a saved graph. `Map`s don't survive `JSON.stringify` (they
 * serialize to `{}`), so `nodes`/`portInstances`/`edges` are stored as JSON
 * strings via `serializeMap` instead of embedding the Graph's real Maps.
 *
 * `history` (undo/redo) is not persisted — it's dropped on save and starts
 * empty on load, since its GraphChange payloads bury Maps at arbitrary depth
 * (e.g. `previousPorts`, `edgeSnapshot`) that would need the same treatment.
 */
interface SerializedGraph {
  readonly formatVersion: number;
  readonly graph: Omit<Graph, 'nodes' | 'portInstances' | 'edges'> & {
    readonly nodes: string;
    readonly portInstances: string;
    readonly edges: string;
  };
}

export const saveProcessrGraph = (graph: Graph): void => {
  const doc: SerializedGraph = {
    formatVersion: DOCUMENT_FORMAT_VERSION,
    graph: {
      ...graph,
      nodes: serializeMap(graph.nodes),
      portInstances: serializeMap(graph.portInstances),
      edges: serializeMap(graph.edges),
      history: { past: [], future: [] },
    },
  };
  localStorage.setItem(GRAPH_KEY, JSON.stringify(doc));
  logger.info(`[saveProcessrGraph] id=${graph.id} nodes=${String(graph.nodes.size)} edges=${String(graph.edges.size)}`);
};

export const loadProcessrGraph = (): Graph | null => {
  const raw = localStorage.getItem(GRAPH_KEY);
  if (raw === null) {
    logger.debug(`[loadProcessrGraph] no saved graph found`);
    return null;
  }
  const doc = JSON.parse(raw) as SerializedGraph;
  if (doc.formatVersion !== DOCUMENT_FORMAT_VERSION) {
    logger.warn(`[loadProcessrGraph] format mismatch — stored=${String(doc.formatVersion)} expected=${String(DOCUMENT_FORMAT_VERSION)}`);
    return null;
  }
  const { nodes, portInstances, edges, ...rest } = doc.graph;
  const graph: Graph = {
    ...rest,
    nodes: deserializeMap<ProcessrNodeId, ProcessrNode>(nodes),
    portInstances: deserializeMap<PortInstanceId, PortInstance>(portInstances),
    edges: deserializeMap<EdgeId, Edge>(edges),
    history: { past: [], future: [] },
  };
  logger.info(`[loadProcessrGraph] id=${graph.id} nodes=${String(graph.nodes.size)} edges=${String(graph.edges.size)}`);
  return graph;
};

export const clearProcessrGraph = (): void => {
  localStorage.removeItem(GRAPH_KEY);
  logger.info(`[clearProcessrGraph] graph cleared`);
};

const UI_SETTINGS_KEY = "processr:ui-settings";

export interface PersistedUISettings {
  readonly snapToGrid: boolean;
  readonly detailedMode: boolean;
  readonly edgeType: string;
  readonly toolMode: string;
  readonly lightTheme: boolean;
  readonly invalidEdgeBehavior?: string;
}

export const saveUISettings = (settings: PersistedUISettings): void => {
  localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  logger.debug(`[saveUISettings] saved`);
};

export const loadUISettings = (): PersistedUISettings | null => {
  const raw = localStorage.getItem(UI_SETTINGS_KEY);
  if (raw === null) {
    logger.debug(`[loadUISettings] no saved settings found`);
    return null;
  }
  logger.debug(`[loadUISettings] loaded`);
  return JSON.parse(raw) as PersistedUISettings;
};

const PACK_EDITOR_TEXT_KEY = "processr:pack-editor-text";

export const saveAtlasEditorText = (text: string): void => {
  localStorage.setItem(PACK_EDITOR_TEXT_KEY, text);
};

export const loadAtlasEditorText = (): string | null => {
  return localStorage.getItem(PACK_EDITOR_TEXT_KEY);
};

const PACK_KEY = "processr:game-pack";

export const saveAtlas = (pack: Atlas): void => {
  localStorage.setItem(PACK_KEY, JSON.stringify(pack));
  logger.info(`[saveAtlas] id=${pack.id} name="${pack.name}"`);
};

export const loadAtlas = (): Atlas | null => {
  const raw = localStorage.getItem(PACK_KEY);
  if (raw === null) {
    logger.debug(`[loadAtlas] no saved atlas found`);
    return null;
  }
  const atlas = JSON.parse(raw) as Atlas;
  logger.info(`[loadAtlas] id=${atlas.id} name="${atlas.name}"`);
  return atlas;
};

export const clearAtlas = (): void => {
  localStorage.removeItem(PACK_KEY);
  logger.info(`[clearAtlas] atlas cleared`);
};