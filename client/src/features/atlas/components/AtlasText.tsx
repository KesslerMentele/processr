import { type FC } from "react";
import { ATLAS_TABS } from "../atlas-text-tabs.ts";
import { useEditorState } from "../hooks/useEditorState.ts";
import type { AtlasEditorView } from "../atlas-types.ts";

interface AtlasTextProps {
  view: AtlasEditorView
}

const AtlasText: FC<AtlasTextProps> = ({ view }) => {
  const { helpOpen, errors } = useEditorState();
  const { containerRefs, activeTab } = view;

  return (
    <div className="pack-editor-body">
      {ATLAS_TABS.map(tab => (
        <div
          key={tab}
          ref={containerRefs[tab]}
          className="pack-editor-cm"
          style={helpOpen || activeTab !== tab ? { display: 'none' } : undefined}
        />
      ))}
      {errors.length > 0 && (
        <div className="pack-editor-errors">
          {errors.map((err, i) => (
            <div key={i} className="pack-editor-error">{err}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtlasText;