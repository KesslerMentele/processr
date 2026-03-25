import {type ReactNode, useCallback, useEffect, useMemo, useReducer, useState} from "react";
import { graphReducer} from "./graph-reducer";
import {buildGamePackIndex} from "../utils/game-pack-index.ts";
import {factorioPack} from "../assets/example-factorio-pack.ts";
import {loadDocument, loadGamePack, saveDocument, saveGamePack} from "../utils/persistence.ts";
import {createGraph} from "../utils/graph-factory.ts";
import {GraphDispatchContext, GraphStateContext, LoadPackContext} from "./useGraph.ts";
import type {GamePack, GraphStateValue} from "../models";





export const GraphProvider = ({children}: {readonly children: ReactNode}) => {
  const [gamePack, setGamePack] = useState<GamePack>(() => loadGamePack() ?? factorioPack);

  const packIndex = useMemo(() => buildGamePackIndex(gamePack), [gamePack]);

  const [state, dispatch] = useReducer(
    graphReducer,
    null,
    () => loadDocument() ?? createGraph(factorioPack.id, "My Factory"),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDocument(state)
    }, 1000);
    return () => {
      clearTimeout(timer)
    };
  }, [state])

  useEffect(() => {
    saveGamePack(gamePack);
  }, [gamePack])

  const loadPack = useCallback((pack:GamePack) => {
    setGamePack(pack);
    dispatch({type:"LOAD_GRAPH", graph: createGraph(pack.id, pack.name)})
  }, [dispatch])

  const stateValue:GraphStateValue = useMemo(() => ({state, packIndex}), [state, packIndex])

  return (
    <GraphStateContext.Provider value={stateValue}>
      <GraphDispatchContext value={dispatch}>
        <LoadPackContext value={loadPack}>
          {children}
        </LoadPackContext>
      </GraphDispatchContext>
    </GraphStateContext.Provider>
  )
}

