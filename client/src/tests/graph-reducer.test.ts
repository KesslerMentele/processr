import { describe, it, expect } from "vitest";
import { graphReducer } from "../reducers/graph-reducer.ts";
import { createGraph } from "../utils/graph-factory.ts";
import { createEdge } from "../utils/edge-factory.ts";
import {
  edgeId,
  gamePackId,
  type Graph,
  type GraphAction,
  type NodeTemplate,
  type NodeWithPorts,
  nodeTemplateId,
  PortDirection,
  portId,
  processrNodeId,
  recipeId,
} from "../models";
import { portInstanceId } from "../models";
import { createProcessrNode } from "../utils/node-factory.ts";

// --- Fixtures ---

const packId = gamePackId('pack-1');

const template: NodeTemplate = {
  id: nodeTemplateId('tpl-1'),
  name: 'Assembler',
  display: { label: 'Assembler' },
  ports: [
    { id: portId('p-in'), name: 'Input', direction: PortDirection.Input, order: 0, metadata: {} },
    { id: portId('p-out'), name: 'Output', direction: PortDirection.Output, order: 0, metadata: {} },
  ],
  stats: { speedMultiplier: 1, metadata: {} },
  tags: [],
  metadata: {},
};

const makeGraph = () => createGraph(packId, 'Test Graph');
const makeNode = (pos = { x: 0, y: 0 }): NodeWithPorts => createProcessrNode(template, pos);
/** Builds the ADD_NODE action for a freshly created node, carrying its port instances along. */
const addNodeAction = ({ node, portInstances }: NodeWithPorts): GraphAction => ({ type: 'ADD_NODE', payload: { node, portInstances } });
/** The node's ports resolved to full PortInstance objects, e.g. for a no-op SET_NODE_RECIPE payload. */
const portsOf = ({ node, portInstances }: NodeWithPorts) => node.ports.map(id => portInstances[id]);
const makeEdge = (sourceNodeId: NodeWithPorts['node']['id'], targetNodeId: NodeWithPorts['node']['id']) =>
  createEdge(sourceNodeId, targetNodeId, { sourcePortId: portInstanceId('p-out'), targetPortId: portInstanceId('p-in') });

/** Applies a sequence of typed actions to a graph, starting from makeGraph() by default. */
const applyActions = (actions: GraphAction[], graph: Graph = makeGraph()): Graph =>
  actions.reduce(graphReducer, graph);

// --- Tests ---

describe('graphReducer', () => {

  describe('ADD_NODE', () => {
    it('adds the node to graph.nodes', () => {
      const nodeWithPorts = makeNode();
      const result = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      expect(result.nodes[nodeWithPorts.node.id]).toEqual(nodeWithPorts.node);
    });

    it('adds the port instances to graph.portInstances', () => {
      const nodeWithPorts = makeNode();
      const result = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      expect(result.portInstances).toEqual(nodeWithPorts.portInstances);
    });

    it('pushes a change to history.past', () => {
      const nodeWithPorts = makeNode();
      const result = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      expect(result.history.past).toHaveLength(1);
    });

    it('clears history.future', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const undone = graphReducer(withNode, { type: 'UNDO' });
      const result = graphReducer(undone, addNodeAction(makeNode()));
      expect(result.history.future).toHaveLength(0);
    });
  });

  describe('REMOVE_NODE', () => {
    it('removes the node from graph.nodes', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', payload: { nodeId: nodeWithPorts.node.id } });
      expect(result.nodes).not.toHaveProperty(nodeWithPorts.node.id);
    });

    it('removes the node\'s port instances from graph.portInstances', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', payload: { nodeId: nodeWithPorts.node.id } });
      expect(Object.keys(result.portInstances)).toHaveLength(0);
    });

    it('removes edges where the node is the source', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: nodeA.node.id } });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('removes edges where the node is the target', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: nodeB.node.id } });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('does not remove unrelated edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const nodeC = makeNode();
      const edgeAB = makeEdge(nodeA.node.id, nodeB.node.id);
      const edgeBC = makeEdge(nodeB.node.id, nodeC.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        addNodeAction(nodeC),
        { type: 'ADD_EDGE', payload: { edge: edgeAB } },
        { type: 'ADD_EDGE', payload: { edge: edgeBC } },
      ]);
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: nodeA.node.id } });
      expect(result.edges).toHaveProperty(edgeBC.id);
    });

    it('leaves nodes unchanged for a non-existent nodeId', () => {
      const graph = makeGraph();
      const result = graphReducer(graph, { type: 'REMOVE_NODE', payload: { nodeId: processrNodeId('ghost') } });
      expect(result.nodes).toEqual(graph.nodes);
    });

    it('pushes a change to history.past', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'REMOVE_NODE', payload: { nodeId: nodeWithPorts.node.id } });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('SET_NODE_POSITION', () => {
    it('updates the node position', () => {
      const nodeWithPorts = makeNode({ x: 0, y: 0 });
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'SET_NODE_POSITIONS', payload: { positions: { [nodeWithPorts.node.id]: { x: 100, y: 200 } } } });
      expect(result.nodes[nodeWithPorts.node.id].position).toEqual({ x: 100, y: 200 });
    });

    it('pushes a change to history.past', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'SET_NODE_POSITIONS', payload: { positions: { [nodeWithPorts.node.id]: { x: 10, y: 10 } } } });
      expect(result.history.past).toHaveLength(2);
    });
  });

  describe('SET_NODE_RECIPE', () => {
    it('sets the recipe on the node', () => {
      const nodeWithPorts = makeNode();
      const rid = recipeId('recipe-1');
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'SET_NODE_RECIPE', payload: { nodeId: nodeWithPorts.node.id, recipeId: rid, ports: portsOf(nodeWithPorts), invalidEdges: {}, behavior: 'highlight' } });
      expect(result.nodes[nodeWithPorts.node.id].recipeId).toBe(rid);
    });

    it('can clear a recipe by setting it to null', () => {
      const nodeWithPorts = makeNode();
      const rid = recipeId('recipe-1');
      const graph = applyActions([
        addNodeAction(nodeWithPorts),
        { type: 'SET_NODE_RECIPE', payload: { nodeId: nodeWithPorts.node.id, recipeId: rid, ports: portsOf(nodeWithPorts), invalidEdges: {}, behavior: 'highlight' } },
      ]);
      const result = graphReducer(graph, { type: 'SET_NODE_RECIPE', payload: { nodeId: nodeWithPorts.node.id, recipeId: null, ports: portsOf(nodeWithPorts), invalidEdges: {}, behavior: 'highlight' } });
      expect(result.nodes[nodeWithPorts.node.id].recipeId).toBeNull();
    });

    it('pushes a change to history.past', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'SET_NODE_RECIPE', payload: { nodeId: nodeWithPorts.node.id, recipeId: recipeId('r-1'), ports: portsOf(nodeWithPorts), invalidEdges: {}, behavior: 'highlight' } });
      expect(result.history.past).toHaveLength(2);
    });

    it('marks connected edges as invalid when behavior is highlight', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, {
        type: 'SET_NODE_RECIPE',
        payload: { nodeId: nodeA.node.id, recipeId: recipeId('r-1'), ports: portsOf(nodeA), invalidEdges: { [edge.id]: edge }, behavior: 'highlight' },
      });
      expect(result.edges[edge.id].invalid).toBe(true);
    });

    it('removes invalid edges when behavior is delete', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, {
        type: 'SET_NODE_RECIPE',
        payload: { nodeId: nodeA.node.id, recipeId: recipeId('r-1'), ports: portsOf(nodeA), invalidEdges: { [edge.id]: edge }, behavior: 'delete' },
      });
      expect(result.edges).not.toHaveProperty(edge.id);
    });
  });

  describe('ADD_EDGE', () => {
    it('adds the edge to graph.edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const withNodes = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
      ]);
      const result = graphReducer(withNodes, { type: 'ADD_EDGE', payload: { edge } });
      expect(result.edges[edge.id]).toEqual(edge);
    });

    it('pushes a change to history.past', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const withNodes = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
      ]);
      const result = graphReducer(withNodes, { type: 'ADD_EDGE', payload: { edge } });
      expect(result.history.past).toHaveLength(3);
    });
  });

  describe('REMOVE_EDGE', () => {
    it('removes the edge from graph.edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
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
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
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
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'UNDO' });
      expect(result.nodes).not.toHaveProperty(nodeWithPorts.node.id);
    });

    it('reverses ADD_NODE and removes its port instances', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
      const result = graphReducer(withNode, { type: 'UNDO' });
      expect(Object.keys(result.portInstances)).toHaveLength(0);
    });

    it('reverses REMOVE_NODE and restores its edges', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
        { type: 'REMOVE_NODE', payload: { nodeId: nodeA.node.id } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes).toHaveProperty(nodeA.node.id);
      expect(result.edges).toHaveProperty(edge.id);
    });

    it('reverses REMOVE_NODE and restores its port instances', () => {
      const nodeA = makeNode();
      const graph = applyActions([
        addNodeAction(nodeA),
        { type: 'REMOVE_NODE', payload: { nodeId: nodeA.node.id } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.portInstances).toEqual(nodeA.portInstances);
    });

    it('reverses SET_NODE_POSITION', () => {
      const nodeWithPorts = makeNode({ x: 0, y: 0 });
      const graph = applyActions([
        addNodeAction(nodeWithPorts),
        { type: 'SET_NODE_POSITIONS', payload: { positions: { [nodeWithPorts.node.id]: { x: 100, y: 100 } } } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes[nodeWithPorts.node.id].position).toEqual({ x: 0, y: 0 });
    });

    it('reverses SET_NODE_RECIPE', () => {
      const nodeWithPorts = makeNode();
      const rid = recipeId('recipe-1');
      const graph = applyActions([
        addNodeAction(nodeWithPorts),
        { type: 'SET_NODE_RECIPE', payload: { nodeId: nodeWithPorts.node.id, recipeId: rid, ports: portsOf(nodeWithPorts), invalidEdges: {}, behavior: 'highlight' } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.nodes[nodeWithPorts.node.id].recipeId).toBeNull();
    });

    it('reverses ADD_EDGE', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.edges).not.toHaveProperty(edge.id);
    });

    it('reverses REMOVE_EDGE', () => {
      const nodeA = makeNode();
      const nodeB = makeNode();
      const edge = makeEdge(nodeA.node.id, nodeB.node.id);
      const graph = applyActions([
        addNodeAction(nodeA),
        addNodeAction(nodeB),
        { type: 'ADD_EDGE', payload: { edge } },
        { type: 'REMOVE_EDGE', payload: { edgeId: edge.id } },
      ]);
      const result = graphReducer(graph, { type: 'UNDO' });
      expect(result.edges).toHaveProperty(edge.id);
    });

    it('moves the change from past to future', () => {
      const nodeWithPorts = makeNode();
      const withNode = graphReducer(makeGraph(), addNodeAction(nodeWithPorts));
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
      const nodeWithPorts = makeNode();
      const graph = applyActions([
        addNodeAction(nodeWithPorts),
        { type: 'UNDO' },
      ]);
      const result = graphReducer(graph, { type: 'REDO' });
      expect(result.nodes).toHaveProperty(nodeWithPorts.node.id);
    });

    it('moves the change from future to past', () => {
      const nodeWithPorts = makeNode();
      const graph = applyActions([
        addNodeAction(nodeWithPorts),
        { type: 'UNDO' },
      ]);
      const result = graphReducer(graph, { type: 'REDO' });
      expect(result.history.past).toHaveLength(1);
      expect(result.history.future).toHaveLength(0);
    });
  });

  describe('history', () => {
    it('clears future when a new action is dispatched after an undo', () => {
      const nodeWithPorts = makeNode();
      const graph = applyActions([
        addNodeAction(nodeWithPorts),
        { type: 'UNDO' },
        addNodeAction(makeNode()),
      ]);
      expect(graph.history.future).toHaveLength(0);
    });
  });

});
