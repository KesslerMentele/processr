import createSelectors from "../utils/state-selectors.ts";
import { create } from "zustand/react";

import type { GraphActionSlice, GraphSlice } from "../models";
import createGraphSlice from "./graph-slice.ts";
import createGraphActions from "./graph-actions-slice.ts";


const useBoundStore = create<GraphSlice & GraphActionSlice>()((setState, getState, store) => ({
  ...createGraphSlice(setState, getState, store),
  ...createGraphActions(setState, getState, store),
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