import RecipePicker from "./RecipePicker.tsx";

import type { MouseEvent } from "react";
import { useContextMenu } from "../../hooks/useContextMenu.ts";
import { useModal } from "../../hooks/useModal.ts";

const RecipesTab = () => {
  const { toggleContextMenu } = useContextMenu();
  const { toggleModal } = useModal();

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Recipe`, onClick: () => {toggleModal({ type:"NewRecipe" });} }
      ],
    });
  };


  return (
      <div className="sidebar-list-container" onContextMenu={onContextMenu}>
        <h1>Recipes</h1>
        <RecipePicker/>

      </div>
  );
};

export default RecipesTab;