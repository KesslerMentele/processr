// ---- ID types ----
export type {
  ItemId,
  RecipeId,
  NodeTemplateId,
  CategoryId,
  GamePackId,
  ProcessrNodeId,
  EdgeId,
  GraphId,
  PortId,
} from "./ids.ts";

export {
  itemId,
  recipeId,
  nodeTemplateId,
  categoryId,
  gamePackId,
  processrNodeId,
  edgeId,
  graphId,
  portId,
} from "./ids.ts";

// ---- Common types ----
export type { Metadata, Position, Size, DisplayInfo } from "./common.ts";
export { TimeUnit } from "./common.ts";

// ---- Game Pack layer (static definitions) ----
export type { Item, Category } from "./items.ts";
export { ItemForm } from "./items.ts";
export type { Recipe, RecipeItemStack } from "./recipes.ts";
export type { NodeTemplate, PortDefinition, NodeStats } from "./nodes.ts";
export { PortDirection } from "./nodes.ts";
export type { Atlas, GamePackIndex, SemVer } from "./atlas.ts";

// ---- Graph layer (user-mutable instances) ----
export type {
  ProcessrNode,
  PortInstance,
  NodeStatsOverride,
  PortEntry
} from "./graph/processr-node.ts";
export type { Edge, EdgeNodeLevel, EdgePortLevel } from "./graph/edge.ts";
export type { Graph, Viewport, GraphAction, ActionType, GraphHistory, GraphChange, ReversibleAction } from "./graph/graph.ts";
export type { ProcessrNodeData } from "./graph/graph-react-connector.ts";

// ---- Serialization ----
export type {
  ProcessrGraph,
  DocumentSummary,
} from "./serialization/document.ts";
export { DOCUMENT_FORMAT_VERSION } from "./serialization/document.ts";
export type {
  DslDocument,
  DslNode,
  DslEdge,
} from "./serialization/dsl.ts";


// ---- State ----
export type { GraphSlice, GraphActionSlice } from "./state/graph-state.ts";
export type { UISettingsSlice } from "./state/ui-state.ts";
export type { AtlasEditorSlice } from "./state/atlas-editor-state.ts";
export { EditorState, type EditorStatus } from "./state/atlas-editor-state.ts";
