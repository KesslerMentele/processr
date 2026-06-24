import type { AtlasTab } from "./atlas-text-tabs.ts";
import type { RefObject } from "react";
import type { Atlas } from "../../models";

// eslint-disable-next-line functional/no-mixed-types
export interface AtlasEditorView {

  readonly containerRefs: Record<AtlasTab, RefObject<HTMLDivElement | null>>;

  /* Returns the currently active tab. */
  readonly activeTab: AtlasTab;

  /* Set the active tab by name. */
  readonly setActiveTab: (tab: AtlasTab) => void;

  /* Whether the editor is currently focused. */
  readonly focused: boolean;

  /* Get the current full text of the atlas. */
  readonly getCurrentText: () => string;

  /* Replace the current text with the given text. */
  readonly replaceAll: (text: string) => void;
}

export interface AtlasParseSuccess { pack: Atlas; errors?: never }

export interface AtlasParseError { errors: string[]; pack?: never }

export type AtlasParseResult = AtlasParseSuccess | AtlasParseError;
