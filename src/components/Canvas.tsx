import {type FC, useCallback, useEffect, useRef} from "react";
import {
  Background, Controls,
  type Edge as RFEdge,
  type Node as RFNode,
  type OnConnect, type OnEdgesDelete,
  type OnMoveEnd,
  type OnNodeDrag, type OnNodesDelete, type OnSelectionChangeFunc,
  ReactFlow, useOnSelectionChange
} from "@xyflow/react";
import { useEdgesState, useNodesState} from "@xyflow/react";
import {fromRFConnection, toRFEdge, toRFNode} from "../utils/reactflow-bridge.ts";
import {edgeId, type ProcessrNodeData, processrNodeId} from "../models";
import {newEdgeId} from "../utils/id.ts";
import ProcessrNodeComponent from "./ProcessrNodeComponent.tsx";
import {useGraphStore} from "../state/graph-store.ts";




const nodeTypes = { processor: ProcessrNodeComponent}
const initialNodes:RFNode<ProcessrNodeData>[] = []
const initialEdges:RFEdge[] = []

const Canvas: FC = () => {

  const graph = useGraphStore.use.graph()

  const setSelectedNodeId = useGraphStore.getState().setSelectedNodeId
  const updateNodePosition = useGraphStore.getState().updateNodePosition
  const removeNode = useGraphStore.getState().removeNode
  const addEdge = useGraphStore.getState().addEdge
  const setViewport = useGraphStore.getState().setViewport
  const removeEdge = useGraphStore.getState().removeEdge

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);
  const isDragging = useRef(false);

  useEffect(() => {
    setRfNodes(graph.nodes.map(toRFNode))
  }, [setRfNodes, graph.nodes]
  );

  useEffect(() => {
    setRfEdges(graph.edges.map(toRFEdge))
  }, [setRfEdges, graph.edges]
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc<RFNode<ProcessrNodeData>>>(({nodes}) => {
    if (!isDragging.current) setSelectedNodeId(nodes[0] ? processrNodeId(nodes[0].id) : null)
  }, [setSelectedNodeId])

  useOnSelectionChange({
    onChange: onSelectionChange
  })

  const onNodeDragStart = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>(() => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = true;
    setSelectedNodeId(null)
  }, [setSelectedNodeId]);

  const onNodeDragStop = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>((_event, node) => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = false;
    updateNodePosition( processrNodeId(node.id), node.position );
  }, [updateNodePosition]);

  const onConnect = useCallback<OnConnect>((connection) => {
    const edge = fromRFConnection({...connection, id: newEdgeId()});
    addEdge(edge)
  }, [addEdge])

  const onMoveEnd = useCallback<OnMoveEnd>((_event, viewport)=> {
    setViewport(viewport)
  }, [setViewport])

  const onNodesDelete = useCallback<OnNodesDelete<RFNode<ProcessrNodeData>>>((nodes) => {
    nodes.forEach(node => {
      removeNode(processrNodeId(node.id))
    })
  }, [removeNode])

  const onEdgesDelete = useCallback<OnEdgesDelete>((edges) => {
    edges.forEach(edge => {
      removeEdge(edgeId(edge.id))
    })
  }, [removeEdge])

  return (
    <div className="canvas-container">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        defaultViewport={graph.viewport}
      >
        <Background/>
        <Controls/>
      </ReactFlow>
    </div>
  )
}

export default Canvas;