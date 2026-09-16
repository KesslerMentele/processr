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
  readonly currentSidebarTab: SidebarTab | null;
  readonly prevSidebarTab: SidebarTab | null;
  readonly sidebarOpen: boolean;
  readonly currentSidebarWidth: number;
  readonly prevSidebarWidth: number;
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
  setSidebarTab: (s: SidebarTab | null) => void;
  setSidebarVisibility: (v: boolean) => void;
  setSidebarWidth: (w: number) => void;
  /**
   * Opens a provided sidebar tab at the previous width.
   *
   * Unlike with setSidebarTab, passing `null` sets the current tab to the last opened tab, as opening to a null tab
   * should not be possible.
   *
   *  modifies `prevSidebarTab`, `currentSidebarTab`, `sidebarOpen`, `currentSidebarWidth`
   */
  openSidebar: (s: SidebarTab | null) => void;
}
