import { useCallback, useRef } from "react";
import {
  type IsValidConnection,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type OnEdgesDelete,
  type OnMoveEnd,
  type OnNodeDrag,
  type OnNodesDelete,
  type OnSelectionChangeFunc,
  type Edge as RFEdge,
  type Node as RFNode,
  useOnSelectionChange,
} from "@xyflow/react";
import { edgeId, type ProcessrNodeData, processrNodeId } from "../models";
import { useProcessrStore } from "../state/store.ts";
import { fromRFConnection } from "../utils/reactflow-bridge.ts";
import { newEdgeId } from "../utils/id.ts";
import { isConnectionValid } from "../utils/graph-utils.ts";
import { logger } from "../utils/logger.ts";

export const useCanvasHandlers = () => {
  const graph = useProcessrStore.use.graph();
  const packIndex = useProcessrStore.use.packIndex();
  const setSelectedNodeId = useProcessrStore.use.setSelectedNodeId();
  const updateNodePositions = useProcessrStore.use.updateNodePositions();
  const removeNode = useProcessrStore.use.removeNode();
  const addEdge = useProcessrStore.use.addEdge();
  const setViewport = useProcessrStore.use.setViewport();
  const removeEdge = useProcessrStore.use.removeEdge();

  const isDragging = useRef(false);
  const isSelectionDragging = useRef(false);
  const pendingSelectionRef = useRef<RFNode<ProcessrNodeData>[]>([]);

  useOnSelectionChange({
    onChange: useCallback<OnSelectionChangeFunc<RFNode<ProcessrNodeData>>>(({ nodes }) => {
      if (isSelectionDragging.current) {
        // eslint-disable-next-line functional/immutable-data
        pendingSelectionRef.current = nodes;
        return;
      }
      if (!isDragging.current && nodes.length <= 1) {
        setSelectedNodeId(nodes[0] ? processrNodeId(nodes[0].id) : null);
      }
    }, [setSelectedNodeId])
  });

  const onSelectionStart = useCallback(() => {
    // eslint-disable-next-line functional/immutable-data
    isSelectionDragging.current = true;
  }, []);

  const onSelectionEnd = useCallback(() => {
    // eslint-disable-next-line functional/immutable-data
    isSelectionDragging.current = false;
    const nodes = pendingSelectionRef.current;
    if (nodes.length === 1) {
      setSelectedNodeId(processrNodeId(nodes[0].id));
    }
  }, [setSelectedNodeId]);

  const onNodeDragStart = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>(() => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = true;
  }, []);

  const onNodeDragStop = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>((_event, _node, nodes) => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = false;
    updateNodePositions(Object.fromEntries(nodes.map(n => [processrNodeId(n.id), n.position])));
  }, [updateNodePositions]);

  const onConnectStart = useCallback<OnConnectStart>((_event, params) => {
    logger.debug(`[Connect] drag start nodeId=${params.nodeId ?? 'none'} handleId=${params.handleId ?? 'none'} handleType=${params.handleType ?? 'none'}`);
  }, []);

  const onConnectEnd = useCallback<OnConnectEnd>((event) => {
    const target = event instanceof MouseEvent ? (event.target as Element).closest('[data-handleid]')?.getAttribute('data-handleid') : null;
    logger.debug(`[Connect] drag end targetHandle=${target ?? 'none (dropped on canvas)'}`);
  }, []);

  const isValidConnection = useCallback<IsValidConnection>((connection) => {
    const result = isConnectionValid(connection, graph, packIndex);
    logger.debug(`[Connect] isValidConnection source=${connection.source}:${connection.sourceHandle ?? 'none'} → target=${connection.target}:${connection.targetHandle ?? 'none'} → ${result ? 'VALID' : 'INVALID'}`);
    return result;
  }, [graph, packIndex]);

  const onConnect = useCallback<OnConnect>((connection) => {
    logger.debug(`[Connect] onConnect source=${connection.source}:${connection.sourceHandle ?? 'none'} → target=${connection.target}:${connection.targetHandle ?? 'none'}`);
    addEdge(fromRFConnection({ ...connection, id: newEdgeId() } as RFEdge));
  }, [addEdge]);

  const onMoveEnd = useCallback<OnMoveEnd>((_event, viewport) => {
    setViewport(viewport);
  }, [setViewport]);

  const onNodesDelete = useCallback<OnNodesDelete<RFNode<ProcessrNodeData>>>((nodes) => {
    nodes.forEach(node => { removeNode(processrNodeId(node.id)); });
  }, [removeNode]);

  const onEdgesDelete = useCallback<OnEdgesDelete>((edges) => {
    edges.forEach(edge => { removeEdge(edgeId(edge.id)); });
  }, [removeEdge]);

  return {
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
  };
};