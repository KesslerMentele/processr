import type { Item } from "../../../models";
import type { FC, MouseEvent } from "react";
import ItemIcon from "../../ItemIcon.tsx";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";

interface ItemButtonProps extends Item {
  onEdit: () => void;
}

const ItemButton: FC<ItemButtonProps> = ({ onEdit, ...item }) => {
  const { toggleContextMenu } = useContextMenu();

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Edit Item`, onClick: onEdit }
      ],
    });
  };

  return (
    <button key={item.id} className="sidebar-btn" onContextMenu={onContextMenu}>
      {item.name}
      <ItemIcon item={item} className="item-icon" title={item.name} />
    </button>
  );
};

export default ItemButton;
