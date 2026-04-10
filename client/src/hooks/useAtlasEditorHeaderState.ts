import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../state/store.ts';

export const useAtlasEditorHeaderState = () => useBoundStore(useShallow(state => ({
  packIndex: state.atlasIndex,
  status: state.editorStatus,
  collapsed: state.editorCollapsed,
  errors: state.editorErrors,
  helpOpen: state.editorHelp,
  loadAtlas: state.loadAtlas,
  togglePackEditor: state.togglePackEditor,
  setPosition: state.setEditorPosition,
  setStatus: state.setEditorStatus,
  setErrors: state.setEditorErrors,
  setAIMode: state.setAIMode,
  setHelpOpen: state.setEditorHelp,
  setCollapsed: state.setEditorCollapsed,
})));