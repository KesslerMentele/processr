import type { Atlas, Graph, ProcessrGraph } from "../models";
import { DOCUMENT_FORMAT_VERSION } from "../models";
import { logger } from "./logger.ts";

const GRAPH_KEY = "processr:graph";

export const saveProcessrGraph = (graph: Graph): void => {
  const doc: ProcessrGraph = {
    formatVersion: DOCUMENT_FORMAT_VERSION,
    graph
  };
  localStorage.setItem(GRAPH_KEY, JSON.stringify(doc));
  logger.info(`[saveProcessrGraph] id=${graph.id} nodes=${String(Object.keys(graph.nodes).length)} edges=${String(Object.keys(graph.edges).length)}`);
};

export const loadProcessrGraph = (): Graph | null => {
  const raw = localStorage.getItem(GRAPH_KEY);
  if (raw === null) {
    logger.debug(`[loadProcessrGraph] no saved graph found`);
    return null;
  }
  const doc = JSON.parse(raw) as ProcessrGraph;
  if (doc.formatVersion !== DOCUMENT_FORMAT_VERSION) {
    logger.warn(`[loadProcessrGraph] format mismatch — stored=${String(doc.formatVersion)} expected=${String(DOCUMENT_FORMAT_VERSION)}`);
    return null;
  }
  logger.info(`[loadProcessrGraph] id=${doc.graph.id} nodes=${String(Object.keys(doc.graph.nodes).length)} edges=${String(Object.keys(doc.graph.edges).length)}`);
  return doc.graph;
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