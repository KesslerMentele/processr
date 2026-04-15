import type { FC } from 'react';
import { useState } from 'react';
import { LuX, LuSendHorizontal } from 'react-icons/lu';
import { useAtlasEditorState } from '../hooks/useAtlasEditorState.ts';
import { usePackEditorView } from '../hooks/usePackEditorView.ts';
import { useShortcutPause } from 'react-keyhub';
import HelpPanel from "./HelpPanel.tsx";
import AtlasEditorHeader from "./AtlasEditorHeader.tsx";
import type { Atlas } from "../../../models";
import { ATLAS_TABS, ATLAS_TAB_LABELS } from '../atlas-text-tabs.ts';

const AtlasEditor: FC = () => {
  const { packIndex, editorPosition, editorCollapsed, aiMode, promptText, helpOpen, errors, status, setEditorErrors, setEditorStatus, setAIMode, setPromptText } = useAtlasEditorState();

  const [pack, setPack] = useState<Atlas | null>(null);

  const { containerRefs, activeTab, setActiveTab, focused, getCurrentText, replaceAll, handleGenerate, abortGenerate } = usePackEditorView({
    packIndex,
    setPack,
    setEditorErrors,
    setEditorStatus,
    setAIMode,
  });

  useShortcutPause(focused);

  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;
    void handleGenerate(promptText);
    setPromptText('');
  };

  return (
    <div className={`pack-editor${editorCollapsed ? ' pack-editor-collapsed' : ''}`} style={{ transform: `translate(${editorPosition.x.toString()}px, ${editorPosition.y.toString()}px)` }}>
      <AtlasEditorHeader
        getCurrentText={getCurrentText}
        replaceAll={replaceAll}
        pack={pack}
        abortGenerate={() => {
          abortGenerate();
        }}
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
        {aiMode && status !== 'thinking' && (
          <div className="pack-editor-prompt">
            <input
              className="pack-editor-prompt-input"
              type="text"
              placeholder="Describe the game pack to generate…"
              value={promptText}
              onChange={e => { setPromptText(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePromptSubmit(); }}
              autoFocus
            />
            <button
              className="pack-editor-icon-btn"
              title="Generate"
              onClick={handlePromptSubmit}
              disabled={!promptText.trim()}
            >
              <LuSendHorizontal />
            </button>
            <button
              className="pack-editor-icon-btn"
              title="Cancel"
              onClick={() => { setAIMode(false); }}
            >
              <LuX />
            </button>
          </div>
        )}
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