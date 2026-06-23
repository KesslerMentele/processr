import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../../../state/store.ts';

export const useEditorHeaderState = () => useBoundStore(useShallow(state => ({
  packIndex: state.atlasIndex,
  status: state.editorStatus,
  collapsed: state.editorCollapsed,
  errors: state.editorErrors,
  loadAtlas: state.loadAtlas,
  togglePackEditor: state.togglePackEditor,
  setPosition: state.setEditorPosition,
  setStatus: state.setEditorStatus,
  setErrors: state.setEditorErrors,
  setAIMode: state.setAIMode,
  setCollapsed: state.setEditorCollapsed,
})));