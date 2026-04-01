import { describe, it, expect } from 'vitest';
import { toRFNode, toRFEdge, fromRFConnection } from './reactflow-bridge.ts';
import { createEdge, createProcessrNode } from './graph-factory.ts';
import { nodeTemplateId, portId, processrNodeId, PortDirection, type NodeTemplate } from '../models';
import type { Edge as RFEdge } from '@xyflow/react';

const template: NodeTemplate = {
  id: nodeTemplateId('tpl-1'),
  name: 'Assembler',
  display: { label: 'Assembler' },
  ports: [
    { id: portId('p-in'), name: 'Input', direction: PortDirection.Input, metadata: {} },
    { id: portId('p-out'), name: 'Output', direction: PortDirection.Output, metadata: {} },
  ],
  stats: { speedMultiplier: 1, metadata: {} },
  tags: [],
  metadata: {},
};

const nodeA = processrNodeId('node-a');
const nodeB = processrNodeId('node-b');

describe('toRFNode', () => {
  it('sets type to "processor"', () => {
    const node = createProcessrNode(template, { x: 0, y: 0 });
    expect(toRFNode(node).type).toBe('processor');
  });

  it('uses the node id', () => {
    const node = createProcessrNode(template, { x: 0, y: 0 });
    expect(toRFNode(node).id).toBe(node.id);
  });

  it('passes through the position', () => {
    const node = createProcessrNode(template, { x: 42, y: 99 });
    expect(toRFNode(node).position).toEqual({ x: 42, y: 99 });
  });

  it('embeds the full node as data', () => {
    const node = createProcessrNode(template, { x: 0, y: 0 });
    expect(toRFNode(node).data).toEqual(node);
  });
});

describe('toRFEdge', () => {
  it('maps source and target node ids', () => {
    const edge = createEdge(nodeA, nodeB);
    const rfEdge = toRFEdge(edge);
    expect(rfEdge.source).toBe(nodeA);
    expect(rfEdge.target).toBe(nodeB);
  });

  it('uses the edge id', () => {
    const edge = createEdge(nodeA, nodeB);
    expect(toRFEdge(edge).id).toBe(edge.id);
  });

  it('maps port ids to source and target handles', () => {
    const edge = createEdge(nodeA, nodeB, {
      sourcePortId: portId('p-out'),
      targetPortId: portId('p-in'),
    });
    const rfEdge = toRFEdge(edge);
    expect(rfEdge.sourceHandle).toBe('p-out');
    expect(rfEdge.targetHandle).toBe('p-in');
  });

  it('maps the label', () => {
    const edge = createEdge(nodeA, nodeB, { label: 'iron plates' });
    expect(toRFEdge(edge).label).toBe('iron plates');
  });

  it('leaves handles undefined for a node-level edge', () => {
    const edge = createEdge(nodeA, nodeB);
    const rfEdge = toRFEdge(edge);
    expect(rfEdge.sourceHandle).toBeUndefined();
    expect(rfEdge.targetHandle).toBeUndefined();
  });
});

describe('fromRFConnection', () => {
  it('maps source and target to ProcessrNodeIds', () => {
    const rfEdge: RFEdge = { id: 'e-1', source: 'node-a', target: 'node-b', sourceHandle: null, targetHandle: null };
    const edge = fromRFConnection(rfEdge);
    expect(edge.sourceNodeId).toBe('node-a');
    expect(edge.targetNodeId).toBe('node-b');
  });

  it('creates a port-level edge when both handles are present', () => {
    const rfEdge: RFEdge = { id: 'e-1', source: 'node-a', target: 'node-b', sourceHandle: 'p-out', targetHandle: 'p-in' };
    const edge = fromRFConnection(rfEdge);
    expect(edge).toHaveProperty('sourcePortId', 'p-out');
    expect(edge).toHaveProperty('targetPortId', 'p-in');
  });

  it('creates a node-level edge when handles are null', () => {
    const rfEdge: RFEdge = { id: 'e-1', source: 'node-a', target: 'node-b', sourceHandle: null, targetHandle: null };
    const edge = fromRFConnection(rfEdge);
    expect(edge).not.toHaveProperty('sourcePortId');
    expect(edge).not.toHaveProperty('targetPortId');
  });
});