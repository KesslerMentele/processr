import type { ProcessrNode, Recipe } from "../../models";
import { useSidebarState } from "../../hooks/useSidebarState.ts";
import type { FC } from "react";

interface RecipeProps {
  recipe: Recipe,
  nodes: ProcessrNode[]
}

const RecipeButton: FC<RecipeProps> = ({ recipe, nodes }) => {
  const allActive = nodes.every(n => n.recipeId === recipe.id);
  const { setNodeRecipes } = useSidebarState();
  return (
    <button
      key={recipe.id}
      className={`sidebar-recipe-btn ${allActive ? "active" : ""}`}
      onClick={() => { setNodeRecipes(nodes.map(n => ({ nodeId: n.id, recipeId: recipe.id }))); }}
    >
      {recipe.name}
    </button>
  );
};

export default RecipeButton;