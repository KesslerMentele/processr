import { describe, it, expect, beforeEach, assert, vi } from 'vitest';
import {
  saveProcessrGraph,
  loadProcessrGraph,
  clearProcessrGraph,
  saveAtlas,
  loadAtlas,
} from '../utils/persistence.ts';
import { createGraph } from '../utils/graph-factory.ts';
import { gamePackId, type Atlas } from '../models';
import { DOCUMENT_FORMAT_VERSION } from '../models';

const storageMap = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storageMap.get(key) ?? null,
  // eslint-disable-next-line functional/immutable-data
  setItem: (key: string, value: string) => storageMap.set(key, value),
  // eslint-disable-next-line functional/immutable-data
  removeItem: (key: string) => storageMap.delete(key),
});

const packId = gamePackId('pack-1');

const minimalPack: Atlas = {
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
  // eslint-disable-next-line functional/immutable-data
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

  // Regression: the `ProcessrNode.ports`/`Graph.portInstances` split (ports
  // embedded PortInstance objects directly on the node; now a node only holds
  // PortInstanceIds, resolved against a separate `graph.portInstances` record)
  // was a breaking schema change, but DOCUMENT_FORMAT_VERSION was never bumped
  // for it. A graph saved under the old shape — no `portInstances` key, node
  // ports as full objects — was accepted as-is and crashed the canvas the
  // moment it tried to resolve a node's ports.
  it('rejects a pre-portInstances-split graph saved under the current format version', () => {
    const legacyGraph = {
      id: 'graph-1',
      name: 'Old Factory',
      gamePackId: packId,
      nodes: {
        'node-1': {
          id: 'node-1',
          templateId: 'tpl-1',
          position: { x: 0, y: 0 },
          recipeId: null,
          statsOverride: { metadata: {} },
          // old shape: full PortInstance objects embedded directly, no portInstances record
          ports: [{ id: 'node-1port-in', template: { id: 'port-in', name: 'In', direction: 'input', metadata: {} } }],
          count: 1,
          metadata: {},
        },
      },
      // note: no `portInstances` key at all — this is what the pre-split schema produced
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
      history: { past: [], future: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    };
    // Tagged with the pre-split format version (1) — exactly what the old code
    // wrote to localStorage. DOCUMENT_FORMAT_VERSION must have moved past it.
    localStorage.setItem('processr:graph', JSON.stringify({ formatVersion: 1, graph: legacyGraph }));
    expect(DOCUMENT_FORMAT_VERSION).toBeGreaterThan(1);
    expect(loadProcessrGraph()).toBeNull();
  });
});

describe('clearDocument', () => {
  it('removes the saved graph so loadProcessrGraph returns null', () => {
    saveProcessrGraph(createGraph(packId, 'My Factory'));
    clearProcessrGraph();
    expect(loadProcessrGraph()).toBeNull();
  });
});

describe('saveGamePack / loadGamePack', () => {
  it('round-trips a game pack through localStorage', () => {
    saveAtlas(minimalPack);
    expect(loadAtlas()).toEqual(minimalPack);
  });

  it('returns null when nothing is saved', () => {
    expect(loadAtlas()).toBeNull();
  });
});