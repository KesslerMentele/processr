import type { FC } from "react";
import type { Recipe } from "../../../models";


interface RecipeButtonProps {
  recipe: Recipe;
}

const RecipeButton:FC<RecipeButtonProps> = ({ recipe }) => {

  return (
    <button key={recipe.id} className="sidebar-btn">
      {recipe.name}
    </button>
  );

};

export default RecipeButton;
