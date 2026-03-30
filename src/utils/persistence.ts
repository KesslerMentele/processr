import type { GamePack, Graph, ProcessrGraph } from "../models";
import { DOCUMENT_FORMAT_VERSION } from "../models";

const STORAGE_KEY = "processr:graph";

export const saveProcessrGraph = (graph: Graph): void => {
  const doc: ProcessrGraph = {
    formatVersion: DOCUMENT_FORMAT_VERSION,
    graph
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
};

export const loadProcessrGraph = (): Graph | null => {
  const raw =localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const doc = JSON.parse(raw) as ProcessrGraph;
  if (doc.formatVersion !== DOCUMENT_FORMAT_VERSION) return null;
  return doc.graph;
};

export const clearDocument = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const PACK_KEY = "processr:game-pack";

export const saveGamePack = (pack: GamePack): void => {
  localStorage.setItem(PACK_KEY, JSON.stringify(pack));
};

export const loadGamePack = (): GamePack | null => {
  const raw = localStorage.getItem(PACK_KEY);
  return raw === null ? null : JSON.parse(raw) as GamePack;
};
