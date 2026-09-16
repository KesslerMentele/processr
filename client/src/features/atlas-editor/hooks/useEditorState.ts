import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../../../state/store.ts';

export const useEditorState = () => useBoundStore(useShallow(state => ({
  atlasIndex: state.atlasIndex,
  editorPosition: state.editorPosition,
  editorCollapsed: state.editorCollapsed,
  helpOpen: state.editorHelp,
  errors: state.editorErrors,
  status: state.editorStatus,
  setEditorErrors: state.setEditorErrors,
  setEditorStatus: state.setEditorStatus,
  packIndex: state.atlasIndex,
  collapsed: state.editorCollapsed,
  loadAtlas: state.loadAtlas,
  togglePackEditor: state.togglePackEditor,
  setPosition: state.setEditorPosition,
  setStatus: state.setEditorStatus,
  setErrors: state.setEditorErrors,
  setAIMode: state.setAIMode,
  setCollapsed: state.setEditorCollapsed,
})));