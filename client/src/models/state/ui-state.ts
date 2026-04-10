import type { EdgeType, InvalidEdgeBehavior, ToolMode } from "../../state/ui-slice.ts";

// eslint-disable-next-line functional/no-mixed-types
export interface UISettingsSlice {
  readonly snapToGrid: boolean;
  readonly detailedMode: boolean;
  readonly edgeType: EdgeType;
  readonly toolMode: ToolMode;
  readonly lightTheme: boolean;
  readonly invalidEdgeBehavior: InvalidEdgeBehavior;
  readonly settingsPanelOpen: boolean;
  readonly packEditorOpen: boolean;
  toggleSnap: () => void;
  toggleDetailed: () => void;
  setEdgeType: (t: EdgeType) => void;
  setToolMode: (m: ToolMode) => void;
  toggleLightTheme: () => void;
  setInvalidEdgeBehavior: (b: InvalidEdgeBehavior) => void;
  toggleSettingsPanel: () => void;
  togglePackEditor: () => void;
}
