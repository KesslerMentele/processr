

interface ContextMenuSidebar {
  target: "Sidebar"
}

interface ContextMenuCanvas {
  target: "Canvas"
}

interface ContextMenuSidebarNode {
  target: "SidebarNode"
}

interface ContextMenuCanvasNode {
  target: "CanvasNode"
}

export type ContextMenuData = ContextMenuSidebar | ContextMenuCanvas | ContextMenuCanvasNode | ContextMenuSidebarNode

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