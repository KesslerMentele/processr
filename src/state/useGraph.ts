import {createContext, use} from "react";
import type {GraphDispatchValue, GraphStateValue, GamePack} from "../models";



export const GraphStateContext = createContext<GraphStateValue | null>(null);
export const GraphDispatchContext = createContext<GraphDispatchValue | null>(null);
export const LoadPackContext = createContext<((pack:GamePack) => void) | null>(null);

export const useGraphState = (): GraphStateValue => {
  const ctx = use(GraphStateContext)
  if (ctx === null) throw new Error("useGraphState must be used within a GraphProvider");
  return ctx;
}
export const useGraphDispatch = (): GraphDispatchValue => {
  const ctx = use(GraphDispatchContext)
  if (ctx === null) throw new Error("useGraphDispatch must be used within a GraphProvider");
  return ctx;
}

export const useLoadPack = (): ((pack:GamePack) => void) => {
  const ctx = use(LoadPackContext)
  if (ctx === null) throw new Error("useLoadPack must be used within a GraphProvider");
  return ctx;
}