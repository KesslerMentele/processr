import { type StateCreator } from 'zustand';
import type { UISettingsSlice } from "../models";
import { loadUISettings, saveUISettings } from "../utils/persistence.ts";

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep';
export type ToolMode = 'pan' | 'select';
export type InvalidEdgeBehavior = 'delete' | 'highlight';

const saved = loadUISettings();

export const createUISlice: StateCreator<UISettingsSlice> = (set) => ({
  snapToGrid: saved?.snapToGrid ?? false,
  detailedMode: saved?.detailedMode ?? false,
  edgeType: (saved?.edgeType as EdgeType | undefined) ?? 'default',
  toolMode: (saved?.toolMode as ToolMode | undefined) ?? 'pan',
  lightTheme: saved?.lightTheme ?? false,
  invalidEdgeBehavior: (saved?.invalidEdgeBehavior as InvalidEdgeBehavior | undefined) ?? 'delete',
  settingsPanelOpen: false,
  packEditorOpen: false,
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
  setEdgeType: (edgeType) => {
    set((state) => {
      persist({ ...state, edgeType });
      return { edgeType };
    });
  },
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
});

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
