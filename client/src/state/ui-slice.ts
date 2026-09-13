import { type StateCreator } from 'zustand';
import type { UISettingsSlice } from "../models";
import { loadUISettings, saveUISettings } from "../utils/persistence.ts";
import type { ModalData } from "../models/modal.ts";
import type { EdgeType, InvalidEdgeBehavior, ToolMode } from "../models/state/ui-state.ts";



const saved = loadUISettings();

/** Zustand slice for canvas/UI preferences, persisted to localStorage on change. */
export const createUISlice: StateCreator<UISettingsSlice> = (set) => ({
  snapToGrid: saved?.snapToGrid ?? false,
  detailedMode: saved?.detailedMode ?? false,
  edgeType: (saved?.edgeType as EdgeType | undefined) ?? 'default',
  toolMode: (saved?.toolMode as ToolMode | undefined) ?? 'pan',
  lightTheme: saved?.lightTheme ?? false,
  invalidEdgeBehavior: (saved?.invalidEdgeBehavior as InvalidEdgeBehavior | undefined) ?? 'delete',
  settingsPanelOpen: false,
  packEditorOpen: false,
  contextMenuOpen: false,
  contextMenuData: null,
  modalOpen: false,
  modalData: null,
  currentSidebarTab: "Node",
  prevSidebarTab: null,
  sidebarOpen: true,
  prevSidebarWidth: 231,
  currentSidebarWidth: 231,
  /** Toggles snap-to-grid for node dragging. */
  toggleSnap: () => {
    set((state) => {
      const next = { snapToGrid: !state.snapToGrid };
      persist({ ...state, ...next });
      return next;
    });
  },
  toggleDetailed: () => {
    set((state) => {
      const next = { detailedMode: !state.detailedMode };
      persist({ ...state, ...next });
      return next;
    });
  },

  /** Sets the React Flow edge rendering style (default/straight/step/smoothstep). */
  setEdgeType: (edgeType) => {
    set((state) => {
      persist({ ...state, edgeType });
      return { edgeType };
    });
  },

  /** Switches the canvas tool between pan and select mode. */
  setToolMode: (toolMode) => {
    set((state) => {
      persist({ ...state, toolMode });
      return { toolMode };
    });
  },
  toggleLightTheme: () => {
    set((state) => {
      const next = { lightTheme: !state.lightTheme };
      persist({ ...state, ...next });
      return next;
    });
  },

  /** Sets whether an invalid edge (created by a recipe/template change) is deleted or highlighted. */
  setInvalidEdgeBehavior: (invalidEdgeBehavior) => {
    set((state) => {
      persist({ ...state, invalidEdgeBehavior });
      return { invalidEdgeBehavior };
    });
  },
  toggleSettingsPanel: () => {
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen }));
  },
  togglePackEditor: () => {
    set((state) => ({ packEditorOpen: !state.packEditorOpen }));
  },

  /** Opens the context menu with the given data, or closes it when passed null. */
  toggleContextMenu: (data) => {
    set(() => ({ contextMenuOpen: data !== null, contextMenuData: data }));
  },

  toggleModal: (data: ModalData | null) => {
    set(() => ({ modalOpen: data !== null, modalData: data }));
  },

  setSidebarTab: (s) => {
    set((state) => ({ prevSidebarTab:state.currentSidebarTab, currentSidebarTab: s }));
  },

  setSidebarVisibility: (visible) => {
    set(() => ({ sidebarOpen: visible }));
  },

  setSidebarWidth: (w: number) => {
    set((state) => ({ prevSidebarWidth:state.currentSidebarWidth,  currentSidebarWidth: w }));
  },

  /**
   * Opens a provided sidebar tab at the previous width.
   *
   * Unlike with setSidebarTab, passing `null` sets the current tab to the last opened tab, as opening to a null tab
   * should not be possible.
   *
   *  modifies `prevSidebarTab`, `currentSidebarTab`, `sidebarOpen`, `currentSidebarWidth`
   */
  openSidebar: (s) => {
    // set visibility to true, set width to prev
    if (s === null) {
      set((state) => ({ prevSidebarTab:null, currentSidebarTab: state.prevSidebarTab, sidebarOpen: true, currentSidebarWidth: state.prevSidebarWidth > 100 ? state.prevSidebarWidth : 231 }));
    } else {
      set((state) => ({ prevSidebarTab:state.currentSidebarTab, currentSidebarTab: s, sidebarOpen: true, currentSidebarWidth: state.prevSidebarWidth > 100 ? state.prevSidebarWidth : 231 }));
    }
  }

});

/** Persists the subset of UI settings that should survive a reload. */
const persist = (state: UISettingsSlice): void => {
  saveUISettings({
    snapToGrid: state.snapToGrid,
    detailedMode: state.detailedMode,
    edgeType: state.edgeType,
    toolMode: state.toolMode,
    lightTheme: state.lightTheme,
    invalidEdgeBehavior: state.invalidEdgeBehavior,
  });
};
