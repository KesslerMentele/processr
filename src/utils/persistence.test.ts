import { describe, it, expect, beforeEach, assert, vi } from 'vitest';
import {
  saveProcessrGraph,
  loadProcessrGraph,
  clearDocument,
  saveGamePack,
  loadGamePack,
} from './persistence.ts';
import { createGraph } from './graph-factory.ts';
import { gamePackId, type GamePack } from '../models';
import { DOCUMENT_FORMAT_VERSION } from '../models';

const storageMap = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
});

const packId = gamePackId('pack-1');

const minimalPack: GamePack = {
  id: packId,
  name: 'Test Pack',
  gameName: 'Test Game',
  version: '1.0.0',
  items: [],
  recipes: [],
  nodeTemplates: [],
  categories: [],
  metadata: {},
};

beforeEach(() => {
  storageMap.clear();
});

describe('saveProcessrGraph / loadProcessrGraph', () => {
  it('round-trips a graph through localStorage', () => {
    const graph = createGraph(packId, 'My Factory');
    saveProcessrGraph(graph);
    expect(loadProcessrGraph()).toEqual(graph);
  });

  it('returns null when nothing is saved', () => {
    expect(loadProcessrGraph()).toBeNull();
  });

  it('returns null when the format version does not match', () => {
    const graph = createGraph(packId, 'My Factory');
    saveProcessrGraph(graph);
    const raw = localStorage.getItem('processr:graph');
    assert(raw !== null);
    const doc = JSON.parse(raw) as { formatVersion: number; graph: unknown };
    localStorage.setItem('processr:graph', JSON.stringify({ ...doc, formatVersion: DOCUMENT_FORMAT_VERSION + 1 }));
    expect(loadProcessrGraph()).toBeNull();
  });
});

describe('clearDocument', () => {
  it('removes the saved graph so loadProcessrGraph returns null', () => {
    saveProcessrGraph(createGraph(packId, 'My Factory'));
    clearDocument();
    expect(loadProcessrGraph()).toBeNull();
  });
});

describe('saveGamePack / loadGamePack', () => {
  it('round-trips a game pack through localStorage', () => {
    saveGamePack(minimalPack);
    expect(loadGamePack()).toEqual(minimalPack);
  });

  it('returns null when nothing is saved', () => {
    expect(loadGamePack()).toBeNull();
  });
});