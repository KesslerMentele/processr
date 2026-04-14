import { type FC, useCallback, useEffect } from "react";
import {
  Background, Controls,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type NodePositionChange,
  ReactFlow, SelectionMode,
} from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { toRFEdge, toRFNode } from "../utils/reactflow-bridge.ts";
import { type ProcessrNodeData, processrNodeId } from "../models";
import ProcessrNodeComponent from "./node/ProcessrNodeComponent.tsx";
import { useShortcut } from "react-keyhub";
import CanvasToolbar from "./CanvasToolbar.tsx";
import AtlasEditor from "./editor/AtlasEditor.tsx";
import { useCanvasHandlers } from "../hooks/useCanvasHandlers.ts";
import { useCanvasState } from "../hooks/useCanvasState.ts";

const nodeTypes = { processor: ProcessrNodeComponent };
const initialNodes: RFNode<ProcessrNodeData>[] = [];
const initialEdges: RFEdge[] = [];

const Canvas: FC = () => {

  const {
    graph, selectedNodeId, toolMode,
    snapToGrid, edgeType, packEditorOpen,
    updateNodePositions, undo, redo
  } = useCanvasState();


  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

  const {
    onSelectionStart,
    onSelectionEnd,
    onNodeDragStart,
    onNodeDragStop,
    isValidConnection,
    onConnectStart,
    onConnectEnd,
    onConnect,
    onMoveEnd,
    onNodesDelete,
    onEdgesDelete,
  } = useCanvasHandlers();


  /* Handle all settled changes.
  A settled change is a change to the position of a node,
  where that node is not being dragged and has been set to a valid new position.
  */
  const handleNodesChange = useCallback((changes: NodeChange<RFNode<ProcessrNodeData>>[]) => {
    onNodesChange(changes);
    const settled = changes.filter(
      (c): c is NodePositionChange & { readonly position: NonNullable<NodePositionChange['position']> } =>
        c.type === 'position' && c.dragging === false && c.position !== undefined
    );

    if (settled.length > 0) {

      updateNodePositions(Object.fromEntries(settled.map(c =>
        [processrNodeId(c.id), c.position]
      )));
    }
  }, [onNodesChange, updateNodePositions]);


  // Effect to reset ReactFlow Nodes array when graph.nodes changes.
  useEffect(() => {

    setRfNodes(Object.values(graph.nodes).map(n => (
      { ...toRFNode(n), selected: n.id === selectedNodeId })
    ));
  }, [setRfNodes, graph.nodes, selectedNodeId]);


  // Effect to reset ReactFlow Edges array when graph.edges changes.
  useEffect(() => {

    setRfEdges(Object.values(graph.edges).map(e => {

      return { ...toRFEdge(e), type: edgeType, animated: e.invalid };
    }));

  }, [setRfEdges, graph.edges, edgeType]);

  // Effect to find and apply selection to ReactFlow Node array based on selectedNodeId
  useEffect(() => {
    if (selectedNodeId === null) return;
    setRfNodes(prev => {
      const target = prev.find(n => n.id === selectedNodeId);
      if (target?.selected) return prev;
      return prev.map(n => n.id === selectedNodeId ? { ...n, selected: true } : n);
    });
  }, [selectedNodeId, setRfNodes]);

  useShortcut('undo', undo);
  useShortcut('redo', redo);

  return (
    <div className="canvas-container">
      {packEditorOpen && <AtlasEditor />}
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionStart={onSelectionStart}
        onSelectionEnd={onSelectionEnd}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onMoveEnd={onMoveEnd}
        defaultViewport={graph.viewport}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        selectionOnDrag={toolMode === 'select'}
        panOnDrag={toolMode === 'select' ? [1, 2] : true}
        multiSelectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
      >
        <Background/>
        <Controls className="canvas-controls"/>
        <CanvasToolbar />
      </ReactFlow>
    </div>
  );
};

export default Canvas;