/**
 * Conceptual types for the Mermaid-like text DSL.
 * The actual parser/grammar will be implemented later.
 *
 * Example syntax concept:
 *
 *   processr v1 "My Iron Factory" using "factorio-base"
 *
 *   node smelter1: ElectricFurnace
 *     recipe: IronPlate
 *     count: 12
 *
 *   node smelter2: ElectricFurnace
 *     recipe: SteelPlate
 *     count: 4
 *
 *   smelter1 --> smelter2 : IronPlate
 */

/**
 * A parsed DSL document before resolution against a game pack.
 * Uses raw string identifiers that get resolved to branded IDs.
 */
export interface DslDocument {
  readonly formatVersion: number;
  readonly graphName: string;
  readonly gamePackRef: string;
  readonly nodes: readonly DslNode[];
  readonly edges: readonly DslEdge[];
}

export interface DslNode {
  /** User-assigned alias in the DSL (e.g., "smelter1"). */
  readonly alias: string;
  /** Node template name or ID. */
  readonly templateRef: string;
  readonly recipeRef?: string;
  readonly count?: number;
  readonly properties: Record<string, string | number | boolean>;
}

export interface DslEdge {
  readonly sourceAlias: string;
  readonly targetAlias: string;
  readonly itemRef?: string;
  readonly label?: string;
}
