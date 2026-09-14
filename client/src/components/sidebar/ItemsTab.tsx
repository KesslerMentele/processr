import { useState, type MouseEvent } from "react";
import { useContextMenu } from "../../hooks/useContextMenu.ts";
import ItemList from "./ItemList.tsx";
import AddItemForm from "./AddItemForm.tsx";

const ItemsTab = () => {

  const { toggleContextMenu } = useContextMenu();
  const [isAddingItem, setIsAddingItem] = useState(false);

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Item`, onClick: () => { setIsAddingItem(true); } }
      ],
    });
  };


  return (
    <div className="sidebar-list-container" onContextMenu={onContextMenu}>
      <h1>Items</h1>
      <ItemList/>
      {isAddingItem && <AddItemForm onClose={() => { setIsAddingItem(false); }} />}
    </div>
  );
};

export default ItemsTab;