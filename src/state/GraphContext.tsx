import { type ReactNode,  useEffect, useMemo, useReducer} from "react";
import { graphReducer} from "./graph-reducer";
import {buildGamePackIndex} from "../utils/game-pack-index.ts";
import {factorioPack} from "../assets/example-factorio-pack.ts";
import {loadDocument, saveDocument} from "../utils/persistence.ts";
import {createGraph} from "../utils/graph-factory.ts";
import {GraphDispatchContext, GraphStateContext} from "./useGraph.ts";
import type {GraphStateValue} from "../models";





export const GraphProvider = ({children}: {readonly children: ReactNode}) => {

  const packIndex = useMemo(() => buildGamePackIndex(factorioPack), []);

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

  const stateValue:GraphStateValue = useMemo(() => ({state, packIndex}), [state, packIndex])

  return (
    <GraphStateContext.Provider value={stateValue}>
      <GraphDispatchContext value={dispatch}>
        {children}
      </GraphDispatchContext>
    </GraphStateContext.Provider>
  )
}

