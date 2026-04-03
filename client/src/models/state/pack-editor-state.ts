import type { Position } from "../common.ts";


export const EditorStatus = {
  Idle: 'idle',
  Parsing: 'parsing',
  Ok: 'ok',
  Error: 'error',
  Applied: 'applied',
  Thinking: 'thinking',
} as const;

export type EditorStatus = (typeof EditorStatus)[keyof typeof EditorStatus];

export interface PackEditorSlice {
  readonly position: Position;
  readonly collapsed: boolean;
  readonly errors: string[];
  readonly status: EditorStatus;
  readonly aiMode: boolean;
  readonly promptText: string;
  readonly showHelp: boolean;
}

export interface PackEditorActionsSlice {
  setPosition: (position: number) => void;
  toggleCollapsed: (mode: boolean) => void;
  setError: (errors: string[]) => void;
  setStatus: (status: EditorStatus) => void;
  toggleAIMode: (mode: boolean) => void;
  setPromptText: (promptText: string) => void;
  toggleHelp: (mode: boolean) => void;
}