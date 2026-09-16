import type { FC, MouseEvent } from "react";
import type { Recipe } from "../../../models";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";


interface RecipeButtonProps {
  recipe: Recipe;
  onEdit: () => void;
}

const RecipeButton:FC<RecipeButtonProps> = ({ recipe, onEdit }) => {
  const { toggleContextMenu } = useContextMenu();

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Edit Recipe`, onClick: onEdit }
      ],
    });
  };

  return (
    <button className="sidebar-btn" onContextMenu={onContextMenu}>
      {recipe.name}
    </button>
  );

};

export default RecipeButton;
