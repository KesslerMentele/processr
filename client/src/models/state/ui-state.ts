import type { EdgeType, ToolMode } from "../../state/ui-slice.ts";

export interface UISettingsSlice {
  readonly snapToGrid: boolean;
  readonly detailedMode: boolean;
  readonly edgeType: EdgeType;
  readonly toolMode: ToolMode;
  readonly settingsPanelOpen: boolean;
  readonly packEditorOpen: boolean;
}
export interface UIActionsSlice {
  toggleSnap: () => void;
  toggleDetailed: () => void;
  setEdgeType: (t: EdgeType) => void;
  setToolMode: (m: ToolMode) => void;
  toggleSettingsPanel: () => void;
  togglePackEditor: () => void;
}