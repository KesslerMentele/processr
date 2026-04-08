import { type StateCreator } from 'zustand';
import type {
  EditorStatus,
  AtlasEditorSlice,
  Position,
} from "../models";
import { EditorState } from "../models";



export const createAtlasSlice: StateCreator<AtlasEditorSlice> = (set): AtlasEditorSlice => {
  return {
    aiMode: false,
    editorCollapsed: false,
    editorErrors: [],
    editorPosition: { x:0, y:0 },
    promptText: "",
    editorHelp: false,
    editorStatus: EditorState.Idle,
    setEditorPosition: (position:Position) =>
    {set(() =>
      ({ editorPosition: position }));},

    setEditorCollapsed: (mode:boolean) =>
    {set(() =>
      ({ editorCollapsed: mode }));},

    setEditorErrors: (errors: string[]) =>
    {set(() =>
      ({ editorErrors: errors }));},

    setEditorStatus: (status: EditorStatus) =>
    {set(() =>
      ({ editorStatus: status }));},

    setAIMode: (mode: boolean) =>
    {set(() =>
      ({ aiMode: mode }));},

    setPromptText: (promptText: string) =>
    {set(() =>
      ({ promptText: promptText }));},

    setEditorHelp: (mode: boolean) =>
    {set(() =>
      ({ editorHelp: mode }));},
  };
};

