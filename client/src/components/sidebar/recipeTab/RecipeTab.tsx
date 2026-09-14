
import { type MouseEvent, useState } from "react";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";
import RecipeList from "./RecipeList.tsx";
import AddRecipeForm from "./AddRecipeForm.tsx";

const RecipeTab = () => {
  const { toggleContextMenu } = useContextMenu();
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Recipe`, onClick: () => {setIsAddingRecipe(true);} }
      ],
    });
  };


  return (
    <div className="sidebar-list-container" onContextMenu={onContextMenu}>
      <h1>Recipes</h1>
      {isAddingRecipe &&
        <>
          <AddRecipeForm onClose={() => { setIsAddingRecipe(false); }} /> <hr/>
        </>
      }
  <RecipeList/>
</div>
);
};

export default RecipeTab;