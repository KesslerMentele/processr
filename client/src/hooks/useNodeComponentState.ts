import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useNodeComponentState = () => useBoundStore(useShallow(state => ({
  packIndex: state.atlasIndex,
  detailedMode: state.detailedMode,
})));