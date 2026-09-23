import { describe, it, expect } from "vitest";
import {
  gamePackId,
  itemId,
  type Atlas,
  type NodeTemplate,
  type Recipe,
  nodeTemplateId,
  recipeId,
  PortDirection,
  portId, type Position,
  processrNodeId
} from "../models";
import { createGraph, createProcessrNode, cloneNode } from "../utils/graph-factory.ts";
import { createEdge } from "../utils/edge-factory.ts";
import { buildAtlasIndex } from "../features/atlas-editor/atlas-index.ts";
import { portInstanceId } from "../models/ids.ts";




describe('createGraph', () => {
  const testPackId = gamePackId('pack-1');
  const graph = createGraph(testPackId, 'Example Factory');
  it('sets the name property', () => {
    expect(graph.name).toBe('Example Factory');
  });
  it('is built with empty nodes', () => {
    expect(graph.nodes).toEqual({});
  });
  it('is built with empty portInstances', () => {
    expect(graph.portInstances).toEqual({});
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
  const sourcePortId = portInstanceId('sourcePort');
  const targetPortId = portInstanceId('targetPort');
  const ports = { sourcePortId, targetPortId };
  const minimalEdge = createEdge(sourceNodeId, targetNodeId, ports);


  it('uses source and target nodes', () => {
    expect(minimalEdge.sourceNodeId).toBe(sourceNodeId);
    expect(minimalEdge.targetNodeId).toBe(targetNodeId);
  });

  it('includes source and target ports', () => {
    const edge = createEdge(sourceNodeId, targetNodeId, ports);
    expect(edge.sourcePortId).toBe(sourcePortId);
    expect(edge.targetPortId).toBe(targetPortId);
  });

  it('is created with empty metadata by default', () => {
    expect(minimalEdge.metadata).toEqual({});
  });
  it('optionally includes metadata', () => {
    const metadata = { foo: 'bar' };
    const edgeWithMetadata = createEdge(sourceNodeId, targetNodeId, ports, { metadata });
    expect(edgeWithMetadata.metadata).toBe(metadata);
  });
  it('optionally includes itemId and label', () => {
    const exampleItemId = itemId('itemId');
    const edgeWithItemAndLabel = createEdge(sourceNodeId, targetNodeId, ports, { itemId:exampleItemId, label:'test' });
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
      { id: portId('port-in'), name: 'Input', direction: PortDirection.Input, order: 0, metadata: {} }
    ],
    stats: { speedMultiplier: 1, metadata: {} },
    tags: [],
    metadata: { foo: 'bar' },
  };
  const position: Position = { x: 0, y: 0 };
  const { node: minimalNode, portInstances: minimalPortInstances } = createProcessrNode(template, position);
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
    expect(minimalPortInstances[minimalNode.ports[0]].template.id).toBe(template.ports[0].id);
  });
  it('will default to a count of 1 node', () => {
    expect(minimalNode.count).toBe(1);
  });
  it('will accept a count from the options', () => {
    const { node: nodeWithCount } = createProcessrNode(template, position, { count: 4 });
    expect(nodeWithCount.count).toBe(4);
  });
  it('takes the metadata from the template', () => {
    expect(minimalNode.metadata).toEqual(template.metadata);
  });

  // Regression: a recipeId passed at creation time used to leave port `.stack`
  // unset (only `setNodeRecipe` populated it), so a node created with a
  // recipe already assigned — e.g. drag-drop auto-selecting a template's only
  // compatible recipe — silently contributed nothing to the stats panel.
  describe('when created with a recipe and an atlas index', () => {
    const recipeTemplate: NodeTemplate = {
      ...template,
      ports: [
        { id: portId('port-in'), name: 'Input', direction: PortDirection.Input, order: 0, metadata: {} },
        { id: portId('port-out'), name: 'Output', direction: PortDirection.Output, order: 0, metadata: {} },
      ],
    };
    const testRecipeId = recipeId('smelt-iron');
    const recipe: Recipe = {
      id: testRecipeId,
      name: 'Smelt Iron',
      display: { label: 'Smelt Iron' },
      inputs: [{ itemId: itemId('iron-ore'), amount: 1 }],
      outputs: [{ itemId: itemId('iron-plate'), amount: 1 }],
      duration: 1,
      compatibleNodeTypes: [recipeTemplate.id],
      metadata: {},
    };
    const atlas: Atlas = {
      id: gamePackId('pack-1'), name: 'Pack', gameName: 'Game', version: '1.0.0',
      items: [], recipes: [recipe], nodeTemplates: [recipeTemplate], categories: [], metadata: {},
    };
    const atlasIndex = buildAtlasIndex(atlas);

    it('populates port stacks immediately, not just on a later setNodeRecipe call', () => {
      const { node, portInstances } = createProcessrNode(recipeTemplate, position, { recipeId: testRecipeId }, atlasIndex);
      const outputPort = Object.values(portInstances).find(p => p.template.direction === PortDirection.Output);
      expect(outputPort?.stack?.itemId).toBe(recipe.outputs[0].itemId);
      // sanity check: the port instance actually belongs to the node
      expect(node.ports).toContain(outputPort?.id);
    });

    it('carries stacks through to a clone as well', () => {
      const { node: source } = createProcessrNode(recipeTemplate, position, { recipeId: testRecipeId }, atlasIndex);
      const { portInstances: clonePortInstances } = cloneNode(source, recipeTemplate, { x: 10, y: 10 }, atlasIndex);
      const outputPort = Object.values(clonePortInstances).find(p => p.template.direction === PortDirection.Output);
      expect(outputPort?.stack?.itemId).toBe(recipe.outputs[0].itemId);
    });
  });
});