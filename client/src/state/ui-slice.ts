import { type StateCreator } from 'zustand';
import type { UIActionsSlice, UISettingsSlice } from "../models";
import { loadUISettings, saveUISettings } from "../utils/persistence.ts";

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep';
export type ToolMode = 'pan' | 'select';

const saved = loadUISettings();

export const createUISlice: StateCreator<UISettingsSlice> = () => ({
  snapToGrid: saved?.snapToGrid ?? false,
  detailedMode: saved?.detailedMode ?? false,
  edgeType: (saved?.edgeType as EdgeType | undefined) ?? 'default',
  toolMode: (saved?.toolMode as ToolMode | undefined) ?? 'pan',
  settingsPanelOpen: false,
  packEditorOpen: false,
});

const persist = (state: UISettingsSlice): void => {
  saveUISettings({
    snapToGrid: state.snapToGrid,
    detailedMode: state.detailedMode,
    edgeType: state.edgeType,
    toolMode: state.toolMode,
  });
};

export const createUIActionsSlice: StateCreator<UISettingsSlice & UIActionsSlice, [], [], UIActionsSlice> = (set) => ({
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
  toggleSettingsPanel: () => {
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen }));
  },
  togglePackEditor: () => {
    set((state) => ({ packEditorOpen: !state.packEditorOpen }));
  },
});