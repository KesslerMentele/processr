/**
 * Branded type pattern for type-safe IDs.
 * At runtime these are plain strings. At compile time, TypeScript
 * prevents mixing up an ItemId with a RecipeId.
 */
declare const __brand: unique symbol;
interface Brand<B> { [__brand]: B}

export type Branded<T, B extends string> = T & Brand<B>;

// ---- Game Pack IDs (static definitions) ----

export type ItemId = Branded<string, "ItemId">;
export type RecipeId = Branded<string, "RecipeId">;
export type NodeTemplateId = Branded<string, "NodeTemplateId">;
export type CategoryId = Branded<string, "CategoryId">;
export type GamePackId = Branded<string, "GamePackId">;

// ---- Graph IDs (user-mutable instances) ----

export type ProcessrNodeId = Branded<string, "ProcessrNodeId">;
export type EdgeId = Branded<string, "EdgeId">;
export type GraphId = Branded<string, "GraphId">;
export type PortId = Branded<string, "PortId">;

// ---- ID factory functions ----
// Cast a plain string to a branded type.
// Use at boundaries: parsing JSON, generating new IDs, etc.

export function itemId(id: string): ItemId {
  return id as ItemId;
}

export function recipeId(id: string): RecipeId {
  return id as RecipeId;
}

export function nodeTemplateId(id: string): NodeTemplateId {
  return id as NodeTemplateId;
}

export function categoryId(id: string): CategoryId {
  return id as CategoryId;
}

export function gamePackId(id: string): GamePackId {
  return id as GamePackId;
}

export function processrNodeId(id: string): ProcessrNodeId {
  return id as ProcessrNodeId;
}

export function edgeId(id: string): EdgeId {
  return id as EdgeId;
}

export function graphId(id: string): GraphId {
  return id as GraphId;
}

export function portId(id: string): PortId {
  return id as PortId;
}
