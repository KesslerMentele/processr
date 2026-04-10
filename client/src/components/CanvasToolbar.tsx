import type { FC } from 'react';
import { Panel } from '@xyflow/react';
import { type EdgeType } from '../state/ui-slice.ts';
import { LuMove, LuLassoSelect, LuSettings2, LuPackage, LuSun, LuMoon } from 'react-icons/lu';
import { useToolbarState } from '../hooks/useToolbarState.ts';

interface EdgeOption  { readonly value: EdgeType; readonly label: string }

const EDGE_OPTIONS: readonly EdgeOption[] = [
  { value: 'default', label: 'Bezier' },
  { value: 'straight', label: 'Straight' },
  { value: 'step', label: 'Step' },
  { value: 'smoothstep', label: 'Smooth' },
];

const CanvasToolbar: FC = () => {
  const { toolMode, snapToGrid, detailedMode, edgeType, lightTheme, invalidEdgeBehavior, settingsPanelOpen, packEditorOpen, setToolMode, toggleSnap, toggleDetailed, setEdgeType, toggleLightTheme, setInvalidEdgeBehavior, toggleSettingsPanel, togglePackEditor } = useToolbarState();

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

      {settingsPanelOpen && (
        <div className="canvas-settings-panel">
          <label className="canvas-settings-panel-toggle">
            <input type="checkbox" checked={snapToGrid} onChange={toggleSnap} />
            Snap to grid
          </label>
          <label className="canvas-settings-panel-toggle">
            <input type="checkbox" checked={detailedMode} onChange={toggleDetailed} />
            Detailed mode
          </label>
          <label className="canvas-settings-panel-toggle">
            <input type="checkbox" checked={lightTheme} onChange={toggleLightTheme} />
            {lightTheme ? <LuSun size={13} /> : <LuMoon size={13} />}
            Light theme
          </label>
          <div className="canvas-settings-panel-section-label">Invalid edges</div>
          <div className="canvas-settings-panel-edge-btns">
            <button
              className={`canvas-settings-panel-edge-btn${invalidEdgeBehavior === 'delete' ? ' active' : ''}`}
              onClick={() => { setInvalidEdgeBehavior('delete'); }}
            >
              Delete
            </button>
            <button
              className={`canvas-settings-panel-edge-btn${invalidEdgeBehavior === 'highlight' ? ' active' : ''}`}
              onClick={() => { setInvalidEdgeBehavior('highlight'); }}
            >
              Highlight
            </button>
          </div>
          <div className="canvas-settings-panel-section-label">Edge style</div>
          <div className="canvas-settings-panel-edge-btns">
            {EDGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                className={`canvas-settings-panel-edge-btn${edgeType === value ? ' active' : ''}`}
                onClick={() => {
                  setEdgeType(value);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};

export default CanvasToolbar;