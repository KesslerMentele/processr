import type { ContextMenuProps } from "../contextMenu.ts";
import type { ModalData } from "../modal.ts";

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep';
export type ToolMode = 'pan' | 'select';
export type InvalidEdgeBehavior = 'delete' | 'highlight';
export type SidebarTab = "Recipe" | "Node" | "Item";

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
  readonly contextMenuOpen: boolean;
  readonly contextMenuData: ContextMenuProps | null;
  readonly modalOpen: boolean;
  readonly modalData: ModalData | null;
  readonly currentSidebarTab: SidebarTab;
  toggleSnap: () => void;
  toggleDetailed: () => void;
  setEdgeType: (t: EdgeType) => void;
  setToolMode: (m: ToolMode) => void;
  toggleLightTheme: () => void;
  setInvalidEdgeBehavior: (b: InvalidEdgeBehavior) => void;
  toggleSettingsPanel: () => void;
  togglePackEditor: () => void;
  toggleContextMenu: (data: ContextMenuProps | null) => void;
  toggleModal: (data: ModalData | null) => void;
  setSidebarTab: (s: SidebarTab) => void;
}
