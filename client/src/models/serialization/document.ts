import type { GraphId, GamePackId } from "../ids.ts";
import type { Graph } from "../graph/graph.ts";
import type { Atlas } from "../atlas.ts";

/** Increment when making breaking changes to the schema. */
export const DOCUMENT_FORMAT_VERSION = 1;

/**
 * A complete serializable document. Saved to localStorage or exported
 * as a JSON file.
 *
 * Can optionally embed the full game pack (for portability/sharing)
 * or reference it by ID (for local storage where the pack is already loaded).
 */
export interface ProcessrGraph {
  readonly formatVersion: number;
  readonly graph: Graph;
  /** Embedded game pack data for export/sharing. Omitted in localStorage. */
  readonly gamePack?: Atlas;
}

/**
 * Lightweight reference for listing saved documents without loading
 * the full graph. Used for the document list / "Open" dialog.
 */
export interface DocumentSummary {
  readonly graphId: GraphId;
  readonly name: string;
  readonly gamePackId: GamePackId;
  readonly gamePackName: string;
  readonly updatedAt: string;
  readonly nodeCount: number;
}
