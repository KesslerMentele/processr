import { useBoundStore } from "../state/store.ts";
import { useShallow } from "zustand/react/shallow";



export const useContextMenu = () => useBoundStore(useShallow(state => ({
  isContextMenuOpen: state.contextMenuOpen,
  toggleContextMenu: state.toggleContextMenu,
  contextMenuData: state.contextMenuData,
})));