import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useSidebarState = () => {
  const state = useBoundStore(useShallow((s) => ({
    selectedNodeIds: s.selectedNodeIds,
    graph: s.graph,
    packIndex: s.atlasIndex,
    setNodeRecipe: s.setNodeRecipe,
    setNodeRecipes: s.setNodeRecipes,
    loadGraph: s.loadGraph,
  })));

  const selectedNodes = useMemo(
    () => state.selectedNodeIds.map(id => state.graph.nodes[id]).filter(Boolean),
    [state.selectedNodeIds, state.graph.nodes]
  );

  return { ...state, selectedNodes };
};