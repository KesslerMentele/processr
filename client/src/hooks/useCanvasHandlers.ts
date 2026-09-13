import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef } from "react";
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
import { edgeId, type ProcessrNodeData, type ProcessrNodeId, processrNodeId } from "../models";
import { useProcessrStore } from "../state/store.ts";
import { fromRFConnection } from "../utils/reactflow-bridge.ts";
import { newEdgeId } from "../utils/id.ts";
import { logger } from "../utils/logger.ts";
import { areItemsCompatible } from "../utils/graph-utils.ts";

export const useCanvasHandlers = () => {
  const graph = useProcessrStore.use.graph();
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const setSelectedNodeIds = useProcessrStore.use.setSelectedNodeIds();
  const updateNodePositions = useProcessrStore.use.updateNodePositions();
  const removeNode = useProcessrStore.use.removeNode();
  const addEdge = useProcessrStore.use.addEdge();
  const setViewport = useProcessrStore.use.setViewport();
  const removeEdge = useProcessrStore.use.removeEdge();

  const isDragging = useRef(false);
  const isSelectionDragging = useRef(false);
  const pendingSelectionRef = useRef<RFNode<ProcessrNodeData>[]>([]);

  // Mirrors the latest selectedNodeIds for onSelectionEnd to read without going stale.
  // during a box-select drag, nothing commits to the store so this ref still holds
  // the pre-drag selection until onSelectionEnd runs.
  const selectedNodeIds = useProcessrStore.use.selectedNodeIds();
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    selectedNodeIdsRef.current = selectedNodeIds;
  }, [selectedNodeIds]);

  useOnSelectionChange({
    onChange: useCallback<OnSelectionChangeFunc<RFNode<ProcessrNodeData>>>(({ nodes }) => {
      if (isSelectionDragging.current) {
        // eslint-disable-next-line functional/immutable-data
        pendingSelectionRef.current = nodes;
        return;
      }
      if (!isDragging.current) {
        setSelectedNodeIds(nodes.map(n => processrNodeId(n.id)));
      }
    }, [setSelectedNodeIds])
  });

  const onSelectionStart = useCallback(() => {
    // eslint-disable-next-line functional/immutable-data
    isSelectionDragging.current = true;
  }, []);

  const onSelectionEnd = useCallback((event: ReactMouseEvent) => {
    // eslint-disable-next-line functional/immutable-data
    isSelectionDragging.current = false;
    const boxedIds = pendingSelectionRef.current.map(n => processrNodeId(n.id));
    const finalIds = event.shiftKey
      ? Array.from(new Set([...selectedNodeIdsRef.current, ...boxedIds]))
      : boxedIds;
    setSelectedNodeIds(finalIds);
  }, [setSelectedNodeIds]);

  const onNodeDragStart = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>(() => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = true;
  }, []);

  const onNodeDragStop = useCallback<OnNodeDrag<RFNode<ProcessrNodeData>>>((_event, _node, nodes) => {
    // eslint-disable-next-line functional/immutable-data
    isDragging.current = false;
    setSelectedNodeIds(nodes.map(n => processrNodeId(n.id)));
    updateNodePositions(Object.fromEntries(nodes.map(n => [processrNodeId(n.id), n.position])));
  }, [setSelectedNodeIds, updateNodePositions]);

  const onConnectStart = useCallback<OnConnectStart>((_event, params) => {
    logger.debug(`[Connect] drag start nodeId=${params.nodeId ?? 'none'} handleId=${params.handleId ?? 'none'} handleType=${params.handleType ?? 'none'}`);
  }, []);

  const onConnectEnd = useCallback<OnConnectEnd>((event) => {
    const target = event instanceof MouseEvent ? (event.target as Element).closest('[data-handleid]')?.getAttribute('data-handleid') : null;
    logger.debug(`[Connect] drag end targetHandle=${target ?? 'none (dropped on canvas)'}`);
  }, []);

  const isValidConnection = useCallback<IsValidConnection>((connection) => {
    logger.debug(`[isValidConnection] checking source=${connection.source}:${connection.sourceHandle ?? 'none'} → target=${connection.target}:${connection.targetHandle ?? 'none'}`);

    if (connection.source === connection.target) { logger.debug('[isValidConnection] REJECT: self-loop'); return false; }

    if (Object.values(graph.edges).some(e =>
      e.sourceNodeId === connection.source &&
      e.targetNodeId === connection.target &&
      e.sourcePortId === (connection.sourceHandle ?? null) &&
      e.targetPortId === (connection.targetHandle ?? null)
    )) { logger.debug('[isValidConnection] REJECT: duplicate edge'); return false; }

    const result = areItemsCompatible(
      { source: connection.source as ProcessrNodeId, target: connection.target as ProcessrNodeId, sourceHandle:connection.sourceHandle, targetHandle: connection.targetHandle }
      , graph, atlasIndex);

    logger.debug(`[isValidConnection] isValidConnection source=${connection.source}:${connection.sourceHandle ?? 'none'} → target=${connection.target}:${connection.targetHandle ?? 'none'} → ${result ? 'VALID' : 'INVALID'}`);
    return result;
  }, [graph, atlasIndex]);

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