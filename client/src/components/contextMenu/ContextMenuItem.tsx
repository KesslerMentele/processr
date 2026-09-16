import type { FC } from "react";
import type { ContextMenuItem as ContextMenuItemData } from "../../models/contextMenu.ts";

interface ContextMenuItemProps {
  item: ContextMenuItemData;
  onSelect: () => void;
}

const ContextMenuItem: FC<ContextMenuItemProps> = ({ item, onSelect }) => {
  return (
    <button
      type="button"
      className="context-menu-item"
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {item.label}
    </button>
  );
};

export default ContextMenuItem;
