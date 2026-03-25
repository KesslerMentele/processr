import type {Graph, ProcessrDocument} from "../models";
import { DOCUMENT_FORMAT_VERSION } from "../models";

const STORAGE_KEY = "processr:document"

export const saveDocument = (graph: Graph): void => {
  const doc: ProcessrDocument = {
    formatVersion: DOCUMENT_FORMAT_VERSION,
    graph
  };
  localStorage.setItem("processr-document", JSON.stringify(doc));
}

export const loadDocument = (): Graph | null => {
  const raw =localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const doc = JSON.parse(raw) as ProcessrDocument;
  if (doc.formatVersion !== DOCUMENT_FORMAT_VERSION) return null;
  return doc.graph;
}

export const clearDocument = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}

// TODO
// export const exportDocument = (graph:Graph, gamepack: GamePack): string => {
//
// }
