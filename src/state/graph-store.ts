import {create, type StoreApi} from 'zustand'
import type {GamePackIndex, Graph, Position, ProcessrNodeId} from "../models";
import type {UseBoundStore} from "zustand/react";
import {loadDocument, loadGamePack} from "../utils/persistence.ts";
import {factorioPack} from "../assets/example-factorio-pack.ts";
import {createGraph} from "../utils/graph-factory.ts";
import {buildGamePackIndex} from "../utils/game-pack-index.ts";
import {combine} from "zustand/middleware";
import {createGraphActions} from "./graph-actions.ts";


export interface GraphState {
  graph: Graph ,
  packIndex: GamePackIndex,
  selectedNodeId: ProcessrNodeId | null,
  screenToFlowPosition: ((screenPos:Position) => Position) | null,
}

type WithSelectors<S> = S extends UseBoundStore<StoreApi<infer T>>
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <T extends GraphState>(
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


const loadDefaults = (): GraphState => {
  const pack = loadGamePack() ?? factorioPack
  const graph = loadDocument() ?? createGraph(pack.id, "My Factory")
  return {
      graph,
      packIndex: buildGamePackIndex(pack),
      selectedNodeId: null,
      screenToFlowPosition: null,
    }
  }

const useGraphStoreBase = create(
  combine( loadDefaults(), (set) => ({
      ...createGraphActions(set),
      setSelectedNodeId: (id: ProcessrNodeId | null) => {
        set((state) => (
          {...state, selectedNodeId: id}
        ))
      },
      setScreenToFlowPosition: (fn: ((screenPos:Position) => Position) | null) => {
        set((state) => (
          {...state, screenToFlowPosition: fn}
        ))
      },
      loadGraph: (graph: Graph, packIndex: GamePackIndex) => {
        set((state) => (
          {...state, graph, packIndex: packIndex}
        ))
      }
  })))


/**
 * Provides access to the zustand store.
 *
 * When retrieving values from the store use:
 * `const sateValue = useGraphStore.use.stateValue()`
 *
 *When accessing functions in the store use:
 * `const storeFunction = useGraphStore.getState().storeFunction`
 */
export const useGraphStore = createSelectors(useGraphStoreBase)
