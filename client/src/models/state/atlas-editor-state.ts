import type { Position } from "../common.ts";


export const EditorState = {
  Idle: 'idle',
  Parsing: 'parsing',
  Ok: 'ok',
  Error: 'error',
  Applied: 'applied',
  Thinking: 'thinking',
} as const;

export type EditorStatus = (typeof EditorState)[keyof typeof EditorState];

// eslint-disable-next-line functional/no-mixed-types
export interface AtlasEditorSlice {
  readonly editorPosition: Position;
  readonly editorCollapsed: boolean;
  readonly editorErrors: string[];
  readonly editorStatus: EditorStatus;
  readonly aiMode: boolean;
  readonly promptText: string;
  readonly editorHelp: boolean;
  setEditorPosition: (position: Position) => void;
  setEditorCollapsed: (mode: boolean) => void;
  setEditorErrors: (errors: string[]) => void;
  setEditorStatus: (status: EditorStatus) => void;
  setAIMode: (mode: boolean) => void;
  setPromptText: (promptText: string) => void;
  setEditorHelp: (mode: boolean) => void;
}






