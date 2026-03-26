import {type FC, useCallback, useEffect, useRef} from "react";
import {
  Background, Controls,
  type Edge as RFEdge,
  type Node as RFNode,
  type OnConnect,
  type OnMoveEnd,
  type OnNodeDrag, type OnNodesDelete, type OnSelectionChangeFunc,
  ReactFlow, useOnSelectionChange
} from "@xyflow/react";
import { useEdgesState, useNodesState} from "@xyflow/react";
import {useGraphDispatch, useGraphState} from "../state/useGraph.ts";
import {fromRFConnection, toRFEdge, toRFNode} from "../utils/reactflow-bridge.ts";
import { type ProcessrNodeData,  processrNodeId} from "../models";
import {newEdgeId} from "../utils/id.ts";
import ProcessrNodeComponent from "./ProcessrNodeComponent.tsx";
import type {CanvasProps} from "../models/nodes.ts";



const nodeTypes = { processor: ProcessrNodeComponent}
const initialNodes:RFNode<ProcessrNodeData>[] = []
const initialEdges:RFEdge[] = []

const Canvas: FC<CanvasProps> = ({onNodeSelect}) => {
  const { state } = useGraphState();
  const dispatch = useGraphDispatch();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);
  const isDragging = useRef(false);

  useEffect(() => {setRfNodes(state.nodes.map(toRFNode))}, [setRfNodes, state.nodes]);
  useEffect(() => {setRfEdges(state.edges.map(toRFEdge))}, [setRfEdges, state.edges])

  const onSelectionChange = useCallback<OnSelectionChangeFunc<RFNode<ProcessrNodeData>>>(({nodes}) => {
    if (!isDragging.current) onNodeSelect(nodes[0] ? processrNodeId(nodes[0].id) : null)
  }, [onNodeSelect])

  useOnSelectionChange({
    onChange: onSelectionChange
  })

  const onNodeDragStart = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>(() => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = true;
    onNodeSelect(null)
  }, [onNodeSelect]);

  const onNodeDragStop = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>((_event, node) => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = false;
    dispatch({ type: "UPDATE_NODE_POSITION", nodeId: processrNodeId(node.id), position: node.position });
  }, [dispatch]);

  const onConnect = useCallback<OnConnect>((connection) => {
    const edge = fromRFConnection({...connection, id: newEdgeId()});
    dispatch({type: "ADD_EDGE", edge})
  }, [dispatch])

  const onMoveEnd = useCallback<OnMoveEnd>((_event, viewport)=> {
    dispatch({type:"SET_VIEWPORT", viewport})
  }, [dispatch])

  const onNodesDelete = useCallback<OnNodesDelete<RFNode<ProcessrNodeData>>>((nodes) => {
    nodes.forEach(node => {
      dispatch({type: "REMOVE_NODE", nodeId: processrNodeId(node.id)})
    })
  }, [dispatch])

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
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        defaultViewport={state.viewport}
      >
        <Background/>
        <Controls/>
      </ReactFlow>
    </div>
  )
}

export default Canvas;