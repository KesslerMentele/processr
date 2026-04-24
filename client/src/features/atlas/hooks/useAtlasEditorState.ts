import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../../../state/store.ts';

export const useAtlasEditorState = () => useBoundStore(useShallow(state => ({
  atlasIndex: state.atlasIndex,
  editorPosition: state.editorPosition,
  editorCollapsed: state.editorCollapsed,
  helpOpen: state.editorHelp,
  errors: state.editorErrors,
  status: state.editorStatus,
  setEditorErrors: state.setEditorErrors,
  setEditorStatus: state.setEditorStatus,
})));