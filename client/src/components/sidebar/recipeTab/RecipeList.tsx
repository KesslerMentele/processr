import { useProcessrStore } from "../../../state/store.ts";
import SidebarGroup from "../SidebarGroup.tsx";
import RecipeButton from "./RecipeButton.tsx";
import RecipeMachineGroup from "./RecipeMachineGroup.tsx";

const UNCATEGORIZED_LABEL = "Uncategorized";

const RecipeList = () => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const { atlas, nodeTemplatesById, recipesByNodeType } = atlasIndex;

  
  const machineIds = [...nodeTemplatesById.keys()];

  const categorizedRecipeIds = new Set(
    machineIds.flatMap((machineId) => (recipesByNodeType.get(machineId) ?? []).map((recipe) => recipe.id))
  );
  const uncategorizedRecipes = atlas.recipes.filter((recipe) => !categorizedRecipeIds.has(recipe.id));

  const renderUncategorizedGroup = () => {
    if (uncategorizedRecipes.length === 0) return null;
    return (
      <SidebarGroup title={UNCATEGORIZED_LABEL}>
        {uncategorizedRecipes.map((recipe) => <RecipeButton recipe={recipe}/>)}
      </SidebarGroup>
    );
  };

  return (
    <>
      {machineIds.map((machineId) => <RecipeMachineGroup machineId={machineId}/>)}
      {renderUncategorizedGroup()}
    </>
  );
};

export default RecipeList;
