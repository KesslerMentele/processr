import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../../../state/store.ts';

export const useAtlasEditorState = () => useBoundStore(useShallow(state => ({
  packIndex: state.atlasIndex,
  editorPosition: state.editorPosition,
  editorCollapsed: state.editorCollapsed,
  aiMode: state.aiMode,
  promptText: state.promptText,
  helpOpen: state.editorHelp,
  errors: state.editorErrors,
  status: state.editorStatus,
  setEditorErrors: state.setEditorErrors,
  setEditorStatus: state.setEditorStatus,
  setAIMode: state.setAIMode,
  setPromptText: state.setPromptText,
})));