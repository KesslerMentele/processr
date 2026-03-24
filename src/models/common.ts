/**
 * Arbitrary extensible metadata. Game packs and users can attach
 * additional data to core entities via this bag.
 *
 * Game pack authors can define narrower types for their own metadata:
 *   type FactorioItemMeta = { pollution_factor: number; stack_size: number };
 *   const meta = item.metadata as FactorioItemMeta;
 */
export type Metadata = Record<string, unknown>;

/** 2D position on the canvas (in canvas coordinates). */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** Dimensions for visual elements. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Visual/display information that game packs can attach to
 * any entity (item, recipe, node template).
 */
export interface DisplayInfo {
  readonly label: string;
  readonly description?: string;
  /** Icon reference — URL, sprite coordinate, SVG path, etc. */
  readonly icon?: string;
  /** Color hint for UI rendering (hex string, e.g. "#ff5722"). */
  readonly color?: string;
}

/** Time unit for recipe durations and throughput rates. */
export const TimeUnit = {
  Second: "second",
  Minute: "minute",
  Hour: "hour",
} as const;

export type TimeUnit = (typeof TimeUnit)[keyof typeof TimeUnit];
