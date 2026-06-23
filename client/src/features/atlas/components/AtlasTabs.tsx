import type { FC } from "react";

import { ATLAS_TABS, ATLAS_TAB_LABELS } from '../atlas-text-tabs.ts';
import type { AtlasEditorView } from "../atlas-types.ts";


interface AtlasTabsProps {
  view: AtlasEditorView
}

const AtlasTabs: FC<AtlasTabsProps> = ({ view }) => {

  const { activeTab, setActiveTab } = view;

  return (
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
  );
};

export default AtlasTabs;