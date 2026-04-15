import { describe, it, expect } from "vitest";
import { graphReducer } from "../reducers/graph-reducer.ts";
import { createGraph, createProcessrNode } from "../utils/graph-factory.ts";
import { createEdge } from "../utils/edge-factory.ts";
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
const makeEdge = (sourceNodeId: ReturnType<typeof makeNode>['id'], targetNodeId: ReturnType<typeof makeNode>['id']) =>
  createEdge(sourceNodeId, targetNodeId, { sourcePortId: portId('p-out'), targetPortId: portId('p-in') });

/** Applies a sequence of typed actions to a graph, starting from makeGraph() by default. */
const applyActions = (actions: GraphAction[], graph: Graph = makeGraph()): Graph =>
  actions.reduce(graphReducer, graph);

// --- Tests ---

describe('graphReducer', () => {

  describe('ADD_NODE', () => {
    it('adds the node to graph.nodes', () => {
      const node = makeNode();
      const result = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      expect(result.nodes[node.id]).toEqual(node);
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const result = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      expect(result.history.past).toHaveLength(1);
    });

    it('clears history.future', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const undone = graphReducer(withNode, { type: 'UNDO' });
      const result = graphReducer(undone, { type: 'ADD_NODE', payload: { node: makeNode() } });
      expect(result.history.future).toHaveLength(0);
    });
  });

  describe('REMOVE_NODE', () => {
    it('removes the node from graph.nodes', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', payload: { nodeId: node.id } });
      expect(result.nodes).not.toHaveProperty(node.id);
    });

    it('removes edges where the node is the source', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: nodeA.id } });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('removes edges where the node is the target', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: nodeB.id } });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('does not remove unrelated edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const nodeC = makeNode();
      const edgeAB = makeEdge(nodeA.id, nodeB.id);
      const edgeBC = makeEdge(nodeB.id, nodeC.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_NODE', payload: { node: nodeC } },
        { type: 'ADD_EDGE', payload: { edge: edgeAB } },
        { type: 'ADD_EDGE', payload: { edge: edgeBC } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: nodeA.id } });
      expect(result.edges).toHaveProperty(edgeBC.id);
    });

    it('leaves nodes unchanged for a non-existent nodeId', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: processrNodeId('ghost') } });
      expect(result.nodes).toEqual(graph.nodes);
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', payload: { nodeId: node.id } });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('SET_NODE_POSITION', () => {
    it('updates the node position', () => {
      const node = makeNode({ x: 0, y: 0 });
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'SET_NODE_POSITIONS', payload: { positions: { [node.id]: { x: 100, y: 200 } } } });
      expect(result.nodes[node.id].position).toEqual({ x: 100, y: 200 });
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'SET_NODE_POSITIONS', payload: { positions: { [node.id]: { x: 10, y: 10 } } } });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('SET_NODE_RECIPE', () => {
    it('sets the recipe on the node', () => {
      const node = makeNode();
      const rid = recipeId('recipe-1');
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'SET_NODE_RECIPE', payload: { nodeId: node.id, recipeId: rid, invalidEdges: {}, behavior: 'highlight' } });
      expect(result.nodes[node.id].recipeId).toBe(rid);
    });

    it('can clear a recipe by setting it to null', () => {
      const node = makeNode();
      const rid = recipeId('recipe-1');
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node } },
        { type: 'SET_NODE_RECIPE', payload: { nodeId: node.id, recipeId: rid, invalidEdges: {}, behavior: 'highlight' } },
      ]);
      const result = graphReducer(graph, { type: 'SET_NODE_RECIPE', payload: { nodeId: node.id, recipeId: null, invalidEdges: {}, behavior: 'highlight' } });
      expect(result.nodes[node.id].recipeId).toBeNull();
    });

    it('pushes a change to history.past', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'SET_NODE_RECIPE', payload: { nodeId: node.id, recipeId: recipeId('r-1'), invalidEdges: {}, behavior: 'highlight' } });
      expect(result.history.past).toHaveLength(2);
    });

    it('marks connected edges as invalid when behavior is highlight', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, {
        type: 'SET_NODE_RECIPE',
        payload: { nodeId: nodeA.id, recipeId: recipeId('r-1'), invalidEdges: { [edge.id]: edge }, behavior: 'highlight' },
      });
      expect(result.edges[edge.id].invalid).toBe(true);
    });

    it('removes invalid edges when behavior is delete', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, {
        type: 'SET_NODE_RECIPE',
        payload: { nodeId: nodeA.id, recipeId: recipeId('r-1'), invalidEdges: { [edge.id]: edge }, behavior: 'delete' },
      });
      expect(result.edges).not.toHaveProperty(edge.id);
    });
  });

  describe('ADD_EDGE', () => {
    it('adds the edge to graph.edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const withNodes = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
      ]);
      const result = graphReducer(withNodes, { type: 'ADD_EDGE', payload: { edge } });
      expect(result.edges[edge.id]).toEqual(edge);
    });

    it('pushes a change to history.past', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const withNodes = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
      ]);
      const result = graphReducer(withNodes, { type: 'ADD_EDGE', payload: { edge } });
      expect(result.history.past).toHaveLength(3);
    });
  });

  describe('REMOVE_EDGE', () => {
    it('removes the edge from graph.edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_EDGE', payload: { edgeId: edge.id } });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('leaves edges unchanged for a non-existent edgeId', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'REMOVE_EDGE', payload: { edgeId: edgeId('ghost') } });
      expect(result.edges).toEqual(graph.edges);
    });

    it('pushes a change to history.past', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_EDGE', payload: { edgeId: edge.id } });
      expect(result.history.past).toHaveLength(4);
    });
  });

  describe('SET_VIEWPORT', () => {
    it('updates the viewport', () => {
      const viewport = { x: 100, y: 200, zoom: 1.5 };
      const result = graphReducer(makeGraph(), { type: 'SET_VIEWPORT', payload: { viewport } });
      expect(result.viewport).toEqual(viewport);
    });

    it('does not push to history', () => {
      const result = graphReducer(makeGraph(), { type: 'SET_VIEWPORT', payload: { viewport: { x: 0, y: 0, zoom: 2 } } });
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
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
      const result = graphReducer(withNode, { type: 'UNDO' });
      expect(result.nodes).not.toHaveProperty(node.id);
    });

    it('reverses REMOVE_NODE and restores its edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
        { type: 'REMOVE_NODE', payload: { nodeId: nodeA.id } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes).toHaveProperty(nodeA.id);
      expect(result.edges).toHaveProperty(edge.id);
    });

    it('reverses SET_NODE_POSITION', () => {
      const node = makeNode({ x: 0, y: 0 });
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node } },
        { type: 'SET_NODE_POSITIONS', payload: { positions: { [node.id]: { x: 100, y: 100 } } } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes[node.id].position).toEqual({ x: 0, y: 0 });
    });

    it('reverses SET_NODE_RECIPE', () => {
      const node = makeNode();
      const rid = recipeId('recipe-1');
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node } },
        { type: 'SET_NODE_RECIPE', payload: { nodeId: node.id, recipeId: rid, invalidEdges: {}, behavior: 'highlight' } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes[node.id].recipeId).toBeNull();
    });

    it('reverses ADD_EDGE', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('reverses REMOVE_EDGE', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.id, nodeB.id);
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node: nodeA } },
        { type: 'ADD_NODE', payload: { node: nodeB } },
        { type: 'ADD_EDGE', payload: { edge } },
        { type: 'REMOVE_EDGE', payload: { edgeId: edge.id } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.edges).toHaveProperty(edge.id);
    });

    it('moves the change from past to future', () => {
      const node = makeNode();
      const withNode = graphReducer(makeGraph(), { type: 'ADD_NODE', payload: { node } });
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
        { type: 'ADD_NODE', payload: { node } },
        { type: 'UNDO' },
      ]);
      const result = graphReducer(graph, { type: 'REDO' });
      expect(result.nodes).toHaveProperty(node.id);
    });

    it('moves the change from future to past', () => {
      const node = makeNode();
      const graph = applyActions([
        { type: 'ADD_NODE', payload: { node } },
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
        { type: 'ADD_NODE', payload: { node } },
        { type: 'UNDO' },
        { type: 'ADD_NODE', payload: { node: makeNode() } },
      ]);
      expect(graph.history.future).toHaveLength(0);
    });
  });

});