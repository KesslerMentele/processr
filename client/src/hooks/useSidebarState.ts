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
    () => state.selectedNodeIds.flatMap(id => {
      const node = state.graph.nodes.get(id);
      return node
        ? [node]
        : [];
    }),
    [state.selectedNodeIds, state.graph.nodes]
  );

  return { ...state, selectedNodes };
};