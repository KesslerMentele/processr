import { describe, it, expect } from "vitest";
import {
  gamePackId,
  itemId,
  type NodeTemplate,
  nodeTemplateId,
  PortDirection,
  portId, type Position,
  processrNodeId
} from "../models";
import { createEdge, createGraph, createProcessrNode } from "../utils/graph-factory.ts";




describe('createGraph', () => {
  const testPackId = gamePackId('pack-1');
  const graph = createGraph(testPackId, 'Example Factory');
  it('sets the name property', () => {
    expect(graph.name).toBe('Example Factory');
  });
  it('is built with empty nodes', () => {
    expect(graph.nodes).toEqual({});
  });
  it('is built with empty edges', () => {
    expect(graph.edges).toEqual({});
  });
  it('has no history on creation', () => {
    expect(graph.history.past.length).toBe(0);
    expect(graph.history.future.length).toBe(0);
  });
  it('sets the packId', () => {
    expect(graph.gamePackId).toBe(testPackId);
  });
});

describe('createEdge', () => {
  const sourceNodeId = processrNodeId('source');
  const targetNodeId = processrNodeId('target');
  const sourcePortId = portId('sourcePort');
  const targetPortId = portId('targetPort');
  const minimalEdge = createEdge(sourceNodeId, targetNodeId);


  it('uses source and target nodes', () => {
    expect(minimalEdge.sourceNodeId).toBe(sourceNodeId);
    expect(minimalEdge.targetNodeId).toBe(targetNodeId);
  });
  it('does not have source/target ports when not specified', () => {

    expect(minimalEdge.sourcePortId).toBeUndefined();
    expect(minimalEdge.targetPortId).toBeUndefined();
  });
  it('optionally includes source and target ports', () => {
    const edge = createEdge(sourceNodeId, targetNodeId, { sourcePortId, targetPortId });
    expect(edge.sourcePortId).toBe(sourcePortId);
    expect(edge.targetPortId).toBe(targetPortId);
  });
  it('fails if there is not both source and target ports or neither', () => {
    expect(() => createEdge(sourceNodeId, targetNodeId, { sourcePortId })).toThrow();
  });
  it('is created with empty metadata by default', () => {
    expect(minimalEdge.metadata).toEqual({});
  });
  it('optionally includes metadata', () => {
    const metadata = { foo: 'bar' };
    const edgeWithMetadata = createEdge(sourceNodeId, targetNodeId, { metadata });
    expect(edgeWithMetadata.metadata).toBe(metadata);
  });
  it('optionally includes itemId and label', () => {
    const exampleItemId = itemId('itemId');
    const edgeWithItemAndLabel = createEdge(sourceNodeId, targetNodeId, { itemId:exampleItemId, label:'test' });
    expect(edgeWithItemAndLabel.itemId).toBe(exampleItemId);
    expect(edgeWithItemAndLabel.label).toBe('test');
  });
});

describe('createProcessrNode', () => {
  const template: NodeTemplate = {
    id: nodeTemplateId('template-1'),
    name: 'templateNode',
    display: { label: 'templateNode' },
    ports: [
      { id: portId('port-in'), name: 'Input', direction: PortDirection.Input, metadata: {} }
    ],
    stats: { speedMultiplier: 1, metadata: {} },
    tags: [],
    metadata: { foo: 'bar' },
  };
  const position: Position = { x: 0, y: 0 };
  const minimalNode = createProcessrNode(template, position);
  // input NodeTemplate
  // input Position
  it('will take the templateId of the template passed', () => {
    expect(minimalNode.templateId).toBe(template.id);
  });
  it('will have a null recipe by default', () => {
    expect(minimalNode.recipeId).toBeNull();
  });
  it('will have a stats override containing only empty metadata by default', () => {
    expect(minimalNode.statsOverride).to.have.property('metadata');
    expect(minimalNode.statsOverride.metadata).toEqual({});
  });
  it('will take the port configuration of the template', () => {
    expect(minimalNode.ports).toHaveLength(1);
    expect(minimalNode.ports[0].definitionId).toBe(template.ports[0].id);
  });
  it('will default to a count of 1 node', () => {
    expect(minimalNode.count).toBe(1);
  });
  it('will accept a count from the options', () => {
    const nodeWithCount = createProcessrNode(template, position, { count: 4 });
    expect(nodeWithCount.count).toBe(4);
  });
  it('takes the metadata from the template', () => {
    expect(minimalNode.metadata).toEqual(template.metadata);
  });
});