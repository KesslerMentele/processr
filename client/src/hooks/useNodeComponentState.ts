import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useNodeComponentState = () => useBoundStore(useShallow(state => ({
  packIndex: state.packIndex,
  detailedMode: state.detailedMode,
})));