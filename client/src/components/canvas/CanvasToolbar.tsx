import type { FC } from 'react';
import { Panel } from '@xyflow/react';
import { LuMove, LuLassoSelect, LuSettings2, LuPackage, LuLayers, LuLayers2 } from 'react-icons/lu';
import { useToolbarState } from '../../hooks/useToolbarState.ts';
import SettingsPanel from "./SettingsPanel.tsx";

const CanvasToolbar: FC = () => {
  const {
    toolMode,
    settingsPanelOpen,
    packEditorOpen,
    selectedNodeIds,
    graph,
    setToolMode,
    toggleSettingsPanel,
    togglePackEditor,
    stackNodes,
    unstackNode,
  } = useToolbarState();

  const canStack = selectedNodeIds.length > 1 &&
    new Set(selectedNodeIds.flatMap(id => {
      const node = graph.nodes.get(id);
      return node ? [node.recipeId] : [];
    })).size === 1;

  const node = graph.nodes.get(selectedNodeIds[0]);
  const canUnstack = selectedNodeIds.length === 1 && node && node.count > 1;

  return (
    <Panel position="top-right" className="canvas-toolbar">
      <div className="canvas-toolbar-strip">
        <button
          className={`canvas-toolbar-btn${toolMode === 'pan' ? ' active' : ''}`}
          title="Pan tool"
          onClick={() => {
            setToolMode('pan');
          }}
        >
          <LuMove />
        </button>

        <button
          className={`canvas-toolbar-btn${toolMode === 'select' ? ' active' : ''}`}
          title="Select tool — drag to box-select, Shift+click to multi-select"
          onClick={() => {
            setToolMode('select');
          }}
        >
          <LuLassoSelect />
        </button>

        <div className="canvas-toolbar-sep" />
        <button
          className="canvas-toolbar-btn"
          title="Stack selected nodes (same type)"
          disabled={!canStack}
          onClick={() => { stackNodes(selectedNodeIds); }}
        >
          <LuLayers />
        </button>

        <button
          className="canvas-toolbar-btn"
          title="Unstack node"
          disabled={!canUnstack}
          onClick={() => { unstackNode(selectedNodeIds[0]); }}
        >
          <LuLayers2  />
        </button>

        <div className="canvas-toolbar-sep" />
        <button
          className={`canvas-toolbar-btn${packEditorOpen ? ' active' : ''}`}
          title="Pack editor"
          onClick={togglePackEditor}
        >
          <LuPackage />
        </button>

        <button
          className={`canvas-toolbar-btn${settingsPanelOpen ? ' active' : ''}`}
          title="Display & grid settings"
          onClick={toggleSettingsPanel}
        >
          <LuSettings2 />
        </button>

      </div>
      {settingsPanelOpen && <SettingsPanel/>}
    </Panel>
  );
};

export default CanvasToolbar;