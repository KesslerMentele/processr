import { useSidebarState } from "../../hooks/useSidebarState.ts";
import RecipePicker from "./RecipePicker.tsx";
import { useContextMenu } from "../../hooks/useContextMenu.ts";
import { useModal } from "../../hooks/useModal.ts";
import type { MouseEvent } from "react";
import ItemList from "./ItemList.tsx";

const ItemsTab = () => {
  const { selectedNodeIds } = useSidebarState();
  const { toggleContextMenu } = useContextMenu();
  const { toggleModal } = useModal();

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Item`, onClick: () => {toggleModal({ type:"NewItem" });} }
      ],
    });
  };

  return (
    <>
      <div className="sidebar-list-container" onContextMenu={onContextMenu}>
        <h1>Items</h1>
        <ItemList/>
      </div>
      {selectedNodeIds.length > 0 ? <> <hr/> <RecipePicker/> </>: null}
    </>
  );
};

export default ItemsTab;