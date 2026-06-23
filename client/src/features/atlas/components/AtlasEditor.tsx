import { type FC, useRef } from 'react';
import { useEditorState } from '../hooks/useEditorState.ts';
import { useEditorView } from '../hooks/useEditorView.ts';
import { useShortcutPause } from 'react-keyhub';
import AtlasEditorHeader from "./AtlasEditorHeader.tsx";
import './atlas-editor.css';
import AtlasTabs from "./AtlasTabs.tsx";
import AtlasText from "./AtlasText.tsx";
import { parseAtlasText } from '../atlas-api.ts';
import { EditorState } from '../../../models';
import { useProcessrStore } from '../../../state/store.ts';

const DEBOUNCE_MS = 600;

const AtlasEditor: FC = () => {
  const { atlasIndex, editorPosition, editorCollapsed, setEditorErrors, setEditorStatus } = useEditorState();
  const loadAtlas = useProcessrStore.getState().loadAtlas;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDocChange = (text: string) => {
    if (!text || text.trim() === '') {
      setEditorStatus(EditorState.Idle);
      setEditorErrors([]);
      return;
    }
    setEditorStatus(EditorState.Parsing);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // eslint-disable-next-line functional/immutable-data
    debounceRef.current = setTimeout(() => {
      void parseAtlasText(text).then((result) => {
        if (result.errors) {
          setEditorErrors(result.errors);
          setEditorStatus(EditorState.Error);
        } else {
          loadAtlas(result.pack);
          setEditorStatus(EditorState.Ok);
          setEditorErrors([]);
        }
      });
    }, DEBOUNCE_MS);
  };

  const atlasEditorView = useEditorView(atlasIndex, onDocChange);

  useShortcutPause(atlasEditorView.focused);


  return (
    <div className={`pack-editor${editorCollapsed ? ' pack-editor-collapsed' : ''}`} style={{ transform: `translate(${editorPosition.x.toString()}px, ${editorPosition.y.toString()}px)` }}>
      <AtlasEditorHeader view={atlasEditorView} />
      <AtlasTabs view={atlasEditorView} />
      <AtlasText view={atlasEditorView} />
    </div>
  );
};

export default AtlasEditor;