import { describe, it, expect } from 'vitest';
import { isNodeLevelEdge } from '../utils/type-validators.ts';
import { createEdge } from '../utils/graph-factory.ts';
import { portId, processrNodeId } from '../models';

const nodeA = processrNodeId('node-a');
const nodeB = processrNodeId('node-b');

describe('isNodeLevelEdge', () => {
  it('returns true for a node-level edge (no ports)', () => {
    const edge = createEdge(nodeA, nodeB);
    expect(isNodeLevelEdge(edge)).toBe(true);
  });

  it('returns false for a port-level edge (with ports)', () => {
    const edge = createEdge(nodeA, nodeB, {
      sourcePortId: portId('p-out'),
      targetPortId: portId('p-in'),
    });
    expect(isNodeLevelEdge(edge)).toBe(false);
  });
});