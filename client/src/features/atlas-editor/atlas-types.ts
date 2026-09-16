import type { AtlasTab } from "./atlas-text-tabs.ts";
import type { RefObject } from "react";
import type { PortDirection, Atlas, CategoryId, ItemForm, NodeTemplateId, RecipeItemStack, TimeUnit } from "../../models";


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


// ---- Mutation Types ----

export interface AddItemInput {
  readonly name: string;
  readonly categoryId?: CategoryId;
  readonly form?: ItemForm;
  readonly color?: string;
  readonly icon?: string;
  readonly description?: string;
}

export interface AddCategoryInput {
  readonly name: string;
  readonly color?: string;
  readonly icon?: string;
  readonly sortOrder?: number;
  readonly parentId?: CategoryId;
}

export interface AddNodeTemplatePortInput {
  readonly name: string;
  readonly direction: PortDirection;
  readonly position?: number;
}

export interface AddNodeTemplateInput {
  readonly name: string;
  readonly categoryId?: CategoryId;
  readonly color?: string;
  readonly icon?: string;
  readonly speedMultiplier?: number;
  readonly powerConsumption?: number;
  readonly moduleSlots?: number;
  readonly ports?: readonly AddNodeTemplatePortInput[];
  readonly tags?: readonly string[];
}

export interface AddRecipeInput {
  readonly name: string;
  readonly duration: number;
  readonly durationUnit?: TimeUnit;
  readonly categoryId?: CategoryId;
  readonly icon?: string;
  readonly inputs?: readonly RecipeItemStack[];
  readonly outputs?: readonly RecipeItemStack[];
  readonly compatibleNodeTypes?: readonly NodeTemplateId[];
  readonly compatibleNodeTags?: readonly string[];
}