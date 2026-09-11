
export type ContextMenuTarget = 'Sidebar' | 'Canvas'


export interface ContextMenuProps {
  x: number,
  y: number,
  data: ContextMenuTarget,
}