/**
 * Branded type pattern for type-safe IDs.
 * At runtime these are plain strings. At compile time, TypeScript
 * prevents mixing up an ItemId with a RecipeId.
 */
declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ---- Game Pack IDs (static definitions) ----

export type ItemId = Brand<string, "ItemId">;
export type RecipeId = Brand<string, "RecipeId">;
export type NodeTemplateId = Brand<string, "NodeTemplateId">;
export type CategoryId = Brand<string, "CategoryId">;
export type GamePackId = Brand<string, "GamePackId">;

// ---- Graph IDs (user-mutable instances) ----

export type ProcessorNodeId = Brand<string, "ProcessorNodeId">;
export type EdgeId = Brand<string, "EdgeId">;
export type GraphId = Brand<string, "GraphId">;
export type PortId = Brand<string, "PortId">;

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

export function processorNodeId(id: string): ProcessorNodeId {
  return id as ProcessorNodeId;
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
