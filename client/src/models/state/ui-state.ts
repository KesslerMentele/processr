import type { EdgeType, ToolMode } from "../../state/ui-slice.ts";

// eslint-disable-next-line functional/no-mixed-types
export interface UISettingsSlice {
  readonly snapToGrid: boolean;
  readonly detailedMode: boolean;
  readonly edgeType: EdgeType;
  readonly toolMode: ToolMode;
  readonly lightTheme: boolean;
  readonly settingsPanelOpen: boolean;
  readonly packEditorOpen: boolean;
  toggleSnap: () => void;
  toggleDetailed: () => void;
  setEdgeType: (t: EdgeType) => void;
  setToolMode: (m: ToolMode) => void;
  toggleLightTheme: () => void;
  toggleSettingsPanel: () => void;
  togglePackEditor: () => void;
}
