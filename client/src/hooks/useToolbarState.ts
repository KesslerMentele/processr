import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useToolbarState = () => useBoundStore(useShallow(state => ({
  toolMode: state.toolMode,
  snapToGrid: state.snapToGrid,
  detailedMode: state.detailedMode,
  edgeType: state.edgeType,
  lightTheme: state.lightTheme,
  settingsPanelOpen: state.settingsPanelOpen,
  packEditorOpen: state.packEditorOpen,
  setToolMode: state.setToolMode,
  toggleSnap: state.toggleSnap,
  toggleDetailed: state.toggleDetailed,
  setEdgeType: state.setEdgeType,
  toggleLightTheme: state.toggleLightTheme,
  toggleSettingsPanel: state.toggleSettingsPanel,
  togglePackEditor: state.togglePackEditor,
})));