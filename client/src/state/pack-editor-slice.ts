import { type StateCreator } from 'zustand';
import { EditorStatus, type PackEditorSlice } from "../models";



const createPackSlice: StateCreator<PackEditorSlice> = (): PackEditorSlice => {
  return {
    aiMode: false,
    collapsed: false,
    errors: [],
    position: { x:0, y:0 },
    promptText: "",
    showHelp: false,
    status: EditorStatus.Idle
  };
};

export default createPackSlice;