import { describe, it, expect } from "vitest";
import { graphReducer } from "../utils/graph-reducer.ts";
import { createEdge, createGraph, createProcessrNode } from "../utils/graph-factory.ts";
import {
  edgeId,
  gamePackId,
  type Graph,
  type GraphAction,
  type NodeTemplate,
  nodeTemplateId,
  PortDirection,
  portId,
  processrNodeId,
  recipeId,
} from "../models";

// --- Fixtures ---

const packId = gamePackId('pack-1');

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

const makeGraph = () => createGraph(packId, 'Test Graph');
const makeNode = (pos = { x: 0, y: 0 }) => createProcessrNode(template, pos);

/** Applies a sequence of typed actions to a graph, starting from makeGraph() by default. */
const applyActions = (actions: GraphAction[], graph: Graph = makeGraph()): Graph =>
  actions.reduce(graphReducer, graph);

// --- Tests ---

describe('graphReducer', () => {

  describe('ADD_NODE', () => {
    it('adds the node to graph.nodes', () => {
      const node = makeNode();
      const result = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      expect(result.nodes[node.id]).toEqual(node);
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const result = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      expect(result.history.past).toHaveLength(1);
    });

    it('clears history.future', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const undone = graphReducer(withNode, { type: 'UNDO' });
      const result = graphReducer(undone, { type: 'ADD_NODE', node: makeNode() });
      expect(result.history.future).toHaveLength(0);
    });
  });

  describe('REMOVE_NODE', () => {
    it('removes the node from graph.nodes', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', nodeId: node.id });
      expect(result.nodes).not.toHaveProperty(node.id);
    });

    it('removes edges where the node is the source', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', nodeId: nodeA.id });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('removes edges where the node is the target', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', nodeId: nodeB.id });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('does not remove unrelated edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const nodeC = makeNode();
      const edgeAB = createEdge(nodeA.id, nodeB.id);
      const edgeBC = createEdge(nodeB.id, nodeC.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_NODE', node: nodeC },
        { type: 'ADD_EDGE', edge: edgeAB },
        { type: 'ADD_EDGE', edge: edgeBC },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', nodeId: nodeA.id });
      expect(result.edges).toHaveProperty(edgeBC.id);
    });

    it('is idempotent for a non-existent nodeId', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'REMOVE_NODE', nodeId: processrNodeId('ghost') });
      expect(result).toBe(graph);
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', nodeId: node.id });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('SET_NODE_POSITION', () => {
    it('updates the node position', () => {
      const node = makeNode({ x: 0, y: 0 });
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'SET_NODE_POSITIONS', positions: { [node.id]: { x: 100, y: 200 } } });
      expect(result.nodes[node.id].position).toEqual({ x: 100, y: 200 });
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'SET_NODE_POSITIONS', positions: { [node.id]: { x: 10, y: 10 } } });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('SET_NODE_RECIPE', () => {
    it('sets the recipe on the node', () => {
      const node = makeNode();
      const rid = recipeId('recipe-1');
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'SET_NODE_RECIPE', nodeId: node.id, recipeId: rid });
      expect(result.nodes[node.id].recipeId).toBe(rid);
    });

    it('can clear a recipe by setting it to null', () => {
      const node = makeNode();
      const rid = recipeId('recipe-1');
      const graph = applyActions([
        { type: 'ADD_NODE', node },
        { type: 'SET_NODE_RECIPE', nodeId: node.id, recipeId: rid },
      ]);
      const result = graphReducer(graph, { type: 'SET_NODE_RECIPE', nodeId: node.id, recipeId: null });
      expect(result.nodes[node.id].recipeId).toBeNull();
    });

    it('is idempotent for a non-existent nodeId', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'SET_NODE_RECIPE', nodeId: processrNodeId('ghost'), recipeId: null });
      expect(result).toBe(graph);
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'SET_NODE_RECIPE', nodeId: node.id, recipeId: recipeId('r-1') });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('ADD_EDGE', () => {
    it('adds the edge to graph.edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const withNodes = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
      ]);
      const result = graphReducer(withNodes, { type: 'ADD_EDGE', edge });
      expect(result.edges[edge.id]).toEqual(edge);
    });

    it('pushes a change to history.past', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const withNodes = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
      ]);
      const result = graphReducer(withNodes, { type: 'ADD_EDGE', edge });
      expect(result.history.past).toHaveLength(3);
    });
  });

  describe('REMOVE_EDGE', () => {
    it('removes the edge from graph.edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_EDGE', edgeId: edge.id });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('is idempotent for a non-existent edgeId', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'REMOVE_EDGE', edgeId: edgeId('ghost') });
      expect(result).toBe(graph);
    });

    it('pushes a change to history.past', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_EDGE', edgeId: edge.id });
      expect(result.history.past).toHaveLength(4);
    });
  });

  describe('SET_VIEWPORT', () => {
    it('updates the viewport', () => {
      const viewport = { x: 100, y: 200, zoom: 1.5 };
      const result = graphReducer(makeGraph(), { type: 'SET_VIEWPORT', viewport });
      expect(result.viewport).toEqual(viewport);
    });

    it('does not push to history', () => {
      const result = graphReducer(makeGraph(), { type: 'SET_VIEWPORT', viewport: { x: 0, y: 0, zoom: 2 } });
      expect(result.history.past).toHaveLength(0);
    });
  });

  describe('UNDO', () => {
    it('returns graph unchanged when history is empty', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result).toBe(graph);
    });

    it('reverses ADD_NODE', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'UNDO' });
      expect(result.nodes).not.toHaveProperty(node.id);
    });

    it('reverses REMOVE_NODE and restores its edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
        { type: 'REMOVE_NODE', nodeId: nodeA.id },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes).toHaveProperty(nodeA.id);
      expect(result.edges).toHaveProperty(edge.id);
    });

    it('reverses SET_NODE_POSITION', () => {
      const node = makeNode({ x: 0, y: 0 });
      const graph = applyActions([
        { type: 'ADD_NODE', node },
        { type: 'SET_NODE_POSITIONS', positions: { [node.id]: { x: 100, y: 100 } } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes[node.id].position).toEqual({ x: 0, y: 0 });
    });

    it('reverses SET_NODE_RECIPE', () => {
      const node = makeNode();
      const rid = recipeId('recipe-1');
      const graph = applyActions([
        { type: 'ADD_NODE', node },
        { type: 'SET_NODE_RECIPE', nodeId: node.id, recipeId: rid },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes[node.id].recipeId).toBeNull();
    });

    it('reverses ADD_EDGE', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('reverses REMOVE_EDGE', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = createEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', node: nodeA },
        { type: 'ADD_NODE', node: nodeB },
        { type: 'ADD_EDGE', edge },
        { type: 'REMOVE_EDGE', edgeId: edge.id },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.edges).toHaveProperty(edge.id);
    });

    it('moves the change from past to future', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', node });
      const result = graphReducer(withNode, { type: 'UNDO' });
      expect(result.history.past).toHaveLength(0);
      expect(result.history.future).toHaveLength(1);
    });
  });

  describe('REDO', () => {
    it('returns graph unchanged when future is empty', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'REDO' });
      expect(result).toBe(graph);
    });

    it('replays the last undone action', () => {
      const node = makeNode();
      const graph = applyActions([
        { type: 'ADD_NODE', node },
        { type: 'UNDO' },
      ]);
      const result = graphReducer(graph, { type: 'REDO' });
      expect(result.nodes).toHaveProperty(node.id);
    });

    it('moves the change from future to past', () => {
      const node = makeNode();
      const graph = applyActions([
        { type: 'ADD_NODE', node },
        { type: 'UNDO' },
      ]);
      const result = graphReducer(graph, { type: 'REDO' });
      expect(result.history.past).toHaveLength(1);
      expect(result.history.future).toHaveLength(0);
    });
  });

  describe('history', () => {
    it('clears future when a new action is dispatched after an undo', () => {
      const node = makeNode();
      const graph = applyActions([
        { type: 'ADD_NODE', node },
        { type: 'UNDO' },
        { type: 'ADD_NODE', node: makeNode() },
      ]);
      expect(graph.history.future).toHaveLength(0);
    });
  });

});
