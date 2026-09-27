import { describe, it, expect } from "vitest";
import { gamePackId } from "../models";
import { createGraph } from "../utils/graph-factory.ts";

describe('createGraph', () => {
  const testPackId = gamePackId('pack-1');
  const graph = createGraph(testPackId, 'Example Factory');

  it('sets the name property', () => {
    expect(graph.name).toBe('Example Factory');
  });
  it('is built with empty nodes', () => {
    expect(graph.nodes).toEqual(new Map());
  });
  it('is built with empty portInstances', () => {
    expect(graph.portInstances).toEqual(new Map());
  });
  it('is built with empty edges', () => {
    expect(graph.edges).toEqual(new Map());
  });
  it('has no history on creation', () => {
    expect(graph.history.past.length).toBe(0);
    expect(graph.history.future.length).toBe(0);
  });
  it('sets the packId', () => {
    expect(graph.gamePackId).toBe(testPackId);
  });
});
