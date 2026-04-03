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
import ProcessrNodeComponent from "./ProcessrNodeComponent.tsx";
import { useProcessrStore } from "../state/store.ts";
import { useShortcut } from "react-keyhub";
import CanvasToolbar from "./CanvasToolbar.tsx";
import PackEditor from "./PackEditor.tsx";
import { useCanvasHandlers } from "../hooks/useCanvasHandlers.ts";

const nodeTypes = { processor: ProcessrNodeComponent };
const initialNodes: RFNode<ProcessrNodeData>[] = [];
const initialEdges: RFEdge[] = [];

const Canvas: FC = () => {

  const graph = useProcessrStore.use.graph();
  const selectedNodeId = useProcessrStore.use.selectedNodeId();
  const toolMode = useProcessrStore.use.toolMode();
  const snapToGrid = useProcessrStore.use.snapToGrid();
  const edgeType = useProcessrStore.use.edgeType();
  const packEditorOpen = useProcessrStore.use.packEditorOpen();
  const updateNodePositions = useProcessrStore.use.updateNodePositions();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

  const {
    onSelectionStart,
    onSelectionEnd,
    onNodeDragStart,
    onNodeDragStop,
    isValidConnection,
    onConnect,
    onMoveEnd,
    onNodesDelete,
    onEdgesDelete,
  } = useCanvasHandlers();

  const handleNodesChange = useCallback((changes: NodeChange<RFNode<ProcessrNodeData>>[]) => {
    onNodesChange(changes);
    const settled = changes.filter((c): c is NodePositionChange => c.type === 'position' && c.dragging === false && c.position !== undefined);
    if (settled.length > 0) {
      updateNodePositions(Object.fromEntries(settled.map(c => [processrNodeId(c.id), c.position!])));
    }
  }, [onNodesChange, updateNodePositions]);

  useEffect(() => {
    setRfNodes(Object.values(graph.nodes).map(n => ({ ...toRFNode(n), selected: n.id === selectedNodeId })));
  }, [setRfNodes, graph.nodes, selectedNodeId]);

  useEffect(() => {
    setRfEdges(Object.values(graph.edges).map(e => ({ ...toRFEdge(e), type: edgeType })));
  }, [setRfEdges, graph.edges, edgeType]);

  useEffect(() => {
    if (selectedNodeId === null) return;
    setRfNodes(prev => {
      const target = prev.find(n => n.id === selectedNodeId);
      if (target?.selected) return prev;
      return prev.map(n => n.id === selectedNodeId ? { ...n, selected: true } : n);
    });
  }, [selectedNodeId, setRfNodes]);

  useShortcut('undo', useProcessrStore.use.undo());
  useShortcut('redo', useProcessrStore.use.redo());

  return (
    <div className="canvas-container">
      {packEditorOpen && <PackEditor />}
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