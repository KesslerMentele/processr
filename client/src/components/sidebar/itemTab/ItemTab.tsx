import { useState, type MouseEvent } from "react";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";
import { useProcessrStore } from "../../../state/store.ts";
import { itemToInput } from "../../../features/atlas-editor/atlas-mutations.ts";
import type { ItemId } from "../../../models";
import ItemList from "./ItemList.tsx";
import AddItemForm from "./AddItemForm.tsx";

type ItemFormState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; id: ItemId };

const ItemTab = () => {

  const { toggleContextMenu } = useContextMenu();
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const [formState, setFormState] = useState<ItemFormState>({ mode: "closed" });

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Item`, onClick: () => { setFormState({ mode: "add" }); } }
      ],
    });
  };

  const editingItem = formState.mode === "edit" ? atlasIndex.itemsById.get(formState.id) : undefined;

  return (
    <div className="sidebar-list-container" onContextMenu={onContextMenu}>
      <h1>Items</h1>
      {formState.mode !== "closed" &&
        <AddItemForm
          onClose={() => { setFormState({ mode: "closed" }); }}
          formMode={
            formState.mode === "edit" && editingItem
              ? { mode: "edit", id: formState.id, initialValues: itemToInput(editingItem) }
              : { mode: "add" }
          }
        />
      }
      <ItemList onEdit={(id) => { setFormState({ mode: "edit", id }); }}/>
    </div>
  );
};

export default ItemTab;