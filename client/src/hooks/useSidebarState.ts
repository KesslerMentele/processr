import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useSidebarState = () =>
  useBoundStore(useShallow((state) => ({
    selectedNodeId: state.selectedNodeId,
    graph: state.graph,
    packIndex: state.packIndex,
    setNodeRecipe: state.setNodeRecipe,
    loadGraph: state.loadGraph,
})));