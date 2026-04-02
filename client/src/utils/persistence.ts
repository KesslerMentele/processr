import type { GamePack, Graph, ProcessrGraph } from "../models";
import { DOCUMENT_FORMAT_VERSION } from "../models";

const GRAPH_KEY = "processr:graph";

export const saveProcessrGraph = (graph: Graph): void => {
  const doc: ProcessrGraph = {
    formatVersion: DOCUMENT_FORMAT_VERSION,
    graph
  };
  localStorage.setItem(GRAPH_KEY, JSON.stringify(doc));
};

export const loadProcessrGraph = (): Graph | null => {
  const raw =localStorage.getItem(GRAPH_KEY);
  if (raw === null) return null;
  const doc = JSON.parse(raw) as ProcessrGraph;
  if (doc.formatVersion !== DOCUMENT_FORMAT_VERSION) return null;
  return doc.graph;
};

export const clearProcessrGraph = (): void => {
  localStorage.removeItem(GRAPH_KEY);
};

const UI_SETTINGS_KEY = "processr:ui-settings";

export interface PersistedUISettings {
  readonly snapToGrid: boolean;
  readonly detailedMode: boolean;
  readonly edgeType: string;
  readonly toolMode: string;
}

export const saveUISettings = (settings: PersistedUISettings): void => {
  localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
};

export const loadUISettings = (): PersistedUISettings | null => {
  const raw = localStorage.getItem(UI_SETTINGS_KEY);
  return raw === null ? null : JSON.parse(raw) as PersistedUISettings;
};

const PACK_EDITOR_TEXT_KEY = "processr:pack-editor-text";

export const savePackEditorText = (text: string): void => {
  localStorage.setItem(PACK_EDITOR_TEXT_KEY, text);
};

export const loadPackEditorText = (): string | null => {
  return localStorage.getItem(PACK_EDITOR_TEXT_KEY);
};

const PACK_KEY = "processr:game-pack";

export const saveGamePack = (pack: GamePack): void => {
  localStorage.setItem(PACK_KEY, JSON.stringify(pack));
};

export const loadGamePack = (): GamePack | null => {
  const raw = localStorage.getItem(PACK_KEY);
  return raw === null ? null : JSON.parse(raw) as GamePack;
};
