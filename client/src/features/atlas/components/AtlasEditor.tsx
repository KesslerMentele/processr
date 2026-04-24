import type { FC } from 'react';
import { useAtlasEditorState } from '../hooks/useAtlasEditorState.ts';
import { useAtlasEditorView } from '../hooks/useAtlasEditorView.ts';
import { useShortcutPause } from 'react-keyhub';
import HelpPanel from "./HelpPanel.tsx";
import AtlasEditorHeader from "./AtlasEditorHeader.tsx";

import { ATLAS_TABS, ATLAS_TAB_LABELS } from '../atlas-text-tabs.ts';

const AtlasEditor: FC = () => {
  const { atlasIndex, editorPosition, editorCollapsed, helpOpen, errors } = useAtlasEditorState();

  const { containerRefs, activeTab, setActiveTab, focused, getCurrentText, replaceAll } = useAtlasEditorView(atlasIndex);

  useShortcutPause(focused);


  return (
    <div className={`pack-editor${editorCollapsed ? ' pack-editor-collapsed' : ''}`} style={{ transform: `translate(${editorPosition.x.toString()}px, ${editorPosition.y.toString()}px)` }}>
      <AtlasEditorHeader
        getCurrentText={getCurrentText}
        replaceAll={replaceAll}
      />

      <div className="pack-editor-tabs">
        {ATLAS_TABS.map(tab => (
          <button
            key={tab}
            className={`pack-editor-tab${activeTab === tab ? ' pack-editor-tab-active' : ''}`}
            onClick={() => { setActiveTab(tab); }}
          >
            {ATLAS_TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="pack-editor-body">
        {ATLAS_TABS.map(tab => (
          <div
            key={tab}
            ref={containerRefs[tab]}
            className="pack-editor-cm"
            style={helpOpen || activeTab !== tab ? { display: 'none' } : undefined}
          />
        ))}
        {helpOpen && <HelpPanel/>}
        {errors.length > 0 && (
          <div className="pack-editor-errors">
            {errors.map((err, i) => (
              <div key={i} className="pack-editor-error">{err}</div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AtlasEditor;