import type { FC } from 'react';
import { Panel } from '@xyflow/react';
import { type EdgeType } from '../state/ui-slice.ts';
import { useProcessrStore } from "../state/store.ts";
import { LuMove, LuLassoSelect, LuSettings2, LuPackage } from 'react-icons/lu';

interface EdgeOption  { readonly value: EdgeType; readonly label: string }

const EDGE_OPTIONS: readonly EdgeOption[] = [
  { value: 'default', label: 'Bezier' },
  { value: 'straight', label: 'Straight' },
  { value: 'step', label: 'Step' },
  { value: 'smoothstep', label: 'Smooth' },
];

const CanvasToolbar: FC = () => {
  const toolMode = useProcessrStore.use.toolMode();
  const snapToGrid = useProcessrStore.use.snapToGrid();
  const detailedMode = useProcessrStore.use.detailedMode();
  const edgeType = useProcessrStore.use.edgeType();
  const settingsPanelOpen = useProcessrStore.use.settingsPanelOpen();
  const packEditorOpen = useProcessrStore.use.packEditorOpen();
  const setToolMode = useProcessrStore.use.setToolMode();
  const toggleSnap = useProcessrStore.use.toggleSnap();
  const toggleDetailed = useProcessrStore.use.toggleDetailed();
  const setEdgeType = useProcessrStore.use.setEdgeType();
  const toggleSettingsPanel = useProcessrStore.use.toggleSettingsPanel();
  const togglePackEditor = useProcessrStore.use.togglePackEditor();

  return (
    <Panel position="top-right" className="canvas-toolbar">
      <div className="canvas-toolbar__strip">
        <button
          className={`canvas-toolbar__btn${toolMode === 'pan' ? ' active' : ''}`}
          title="Pan tool"
          onClick={() => {
            setToolMode('pan');
          }}
        >
          <LuMove />
        </button>
        <button
          className={`canvas-toolbar__btn${toolMode === 'select' ? ' active' : ''}`}
          title="Select tool — drag to box-select, Shift+click to multi-select"
          onClick={() => {
            setToolMode('select');
          }}
        >
          <LuLassoSelect />
        </button>
        <div className="canvas-toolbar__sep" />
        <button
          className={`canvas-toolbar__btn${packEditorOpen ? ' active' : ''}`}
          title="Pack editor"
          onClick={togglePackEditor}
        >
          <LuPackage />
        </button>
        <button
          className={`canvas-toolbar__btn${settingsPanelOpen ? ' active' : ''}`}
          title="Display & grid settings"
          onClick={toggleSettingsPanel}
        >
          <LuSettings2 />
        </button>
      </div>

      {settingsPanelOpen && (
        <div className="canvas-settings-panel">
          <label className="canvas-settings-panel__toggle">
            <input type="checkbox" checked={snapToGrid} onChange={toggleSnap} />
            Snap to grid
          </label>
          <label className="canvas-settings-panel__toggle">
            <input type="checkbox" checked={detailedMode} onChange={toggleDetailed} />
            Detailed mode
          </label>
          <div className="canvas-settings-panel__section-label">Edge style</div>
          <div className="canvas-settings-panel__edge-btns">
            {EDGE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                className={`canvas-settings-panel__edge-btn${edgeType === value ? ' active' : ''}`}
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