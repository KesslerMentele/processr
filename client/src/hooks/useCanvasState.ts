import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useCanvasState = () => useBoundStore(useShallow(state => ({
  graph: state.graph,
  selectedNodeIds: state.selectedNodeIds,
  toolMode: state.toolMode,
  snapToGrid: state.snapToGrid,
  edgeType: state.edgeType,
  packEditorOpen: state.packEditorOpen,
  updateNodePositions: state.updateNodePositions,
  undo: state.undo,
  redo: state.redo,
})));