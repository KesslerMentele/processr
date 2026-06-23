import { useToolbarState } from "../../hooks/useToolbarState.ts";
import type { EdgeType } from "../../state/ui-slice.ts";

interface EdgeOption  { readonly value: EdgeType; readonly label: string }

const EDGE_OPTIONS: readonly EdgeOption[] = [
  { value: 'default', label: 'Bezier' },
  { value: 'straight', label: 'Straight' },
  { value: 'step', label: 'Step' },
  { value: 'smoothstep', label: 'Smooth' },
];

const EdgeSettings = () => {

  const {
    invalidEdgeBehavior,
    edgeType,
    setEdgeType,
    setInvalidEdgeBehavior
  } = useToolbarState();

  return (
    <>
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
  </>
  );
};

export default EdgeSettings;