
export type ContextMenuTarget = 'Sidebar' | 'Canvas' | 'CanvasNode'

export interface ContextMenuData {
  target: ContextMenuTarget
}

/** A single clickable row in a context menu. */
// eslint-disable-next-line functional/no-mixed-types
export interface ContextMenuItem {
  readonly label: string;
  readonly onClick: () => void;
}

export interface ContextMenuProps {
  x: number,
  y: number,
  data: ContextMenuData,
  items: readonly ContextMenuItem[],
}