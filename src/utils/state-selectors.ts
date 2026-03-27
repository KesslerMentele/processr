
import type {StoreApi} from "zustand";

import type {UseBoundStore} from "zustand/react";
import type {GraphActionSlice, GraphSlice} from "../models";

type WithSelectors<S> = S extends UseBoundStore<StoreApi<infer T>>
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <T extends (GraphSlice | GraphActionSlice)>(
  store: UseBoundStore<StoreApi<T>>
): WithSelectors<typeof store> => {
  const use =  (Object.keys(store.getState()) as (keyof T)[]).reduce(
    (acc, key) => ({
      ...acc,
      [key]: () => store((state) => state[key]),
    }),
    {} as WithSelectors<typeof store>['use']
  )
  return {...store as object, use } as WithSelectors<typeof store>
}

export default createSelectors;