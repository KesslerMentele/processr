import createSelectors from "../utils/state-selectors.ts";
import { create } from "zustand/react";

import type {
  GraphActionSlice,
  GraphSlice,
  PackEditorSlice,
  UIActionsSlice,
  UISettingsSlice
} from "../models";
import createGraphSlice from "./graph-slice.ts";
import createGraphActions from "./graph-actions-slice.ts";
import { createUIActionsSlice, createUISlice } from "./ui-slice.ts";
import createPackSlice from "./pack-editor-slice.ts";


const useBoundStore = create<
  GraphSlice
  & GraphActionSlice
  & UISettingsSlice
  & UIActionsSlice
  & PackEditorSlice
>()((setState, getState, store) => ({
  ...createGraphSlice(setState, getState, store),
  ...createGraphActions(setState, getState, store),
  ...createUISlice(setState, getState, store),
  ...createUIActionsSlice(setState, getState, store),
  ...createPackSlice(setState, getState, store),
}));


/**
 * Provides access to the zustand store.
 *
 * When retrieving values from the store use:
 * `const sateValue = useGraphStore.use.stateValue()`
 *
 *When accessing functions in the store use:
 * `const storeFunction = useGraphStore.getState().storeFunction`
 */
export const useProcessrStore = createSelectors(useBoundStore);