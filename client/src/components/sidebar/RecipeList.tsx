import { useProcessrStore } from "../../state/store.ts";
import type { NodeTemplateId, Recipe } from "../../models";
import SidebarRecipeGroup from "./SidebarRecipeGroup.tsx";

const UNCATEGORIZED_LABEL = "Uncategorized";

const RecipeList = () => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const { atlas, nodeTemplatesById, recipesByNodeType } = atlasIndex;

  const machineIds = [...nodeTemplatesById.keys()];

  const categorizedRecipeIds = new Set(
    machineIds.flatMap((machineId) => (recipesByNodeType.get(machineId) ?? []).map((recipe) => recipe.id))
  );
  const uncategorizedRecipes = atlas.recipes.filter((recipe) => !categorizedRecipeIds.has(recipe.id));

  const renderRecipeButton = (recipe: Recipe) => (
    <button key={recipe.id} className="sidebar-btn">
      {recipe.name}
    </button>
  );

  const renderMachineGroup = (machineId: NodeTemplateId) => {
    const recipes = recipesByNodeType.get(machineId) ?? [];
    if (recipes.length === 0) return null;
    const template = nodeTemplatesById.get(machineId);
    return (
      <SidebarRecipeGroup key={machineId} title={template?.name ?? machineId}>
        {recipes.map(renderRecipeButton)}
      </SidebarRecipeGroup>
    );
  };

  const renderUncategorizedGroup = () => {
    if (uncategorizedRecipes.length === 0) return null;
    return (
      <SidebarRecipeGroup title={UNCATEGORIZED_LABEL}>
        {uncategorizedRecipes.map(renderRecipeButton)}
      </SidebarRecipeGroup>
    );
  };

  return (
    <>
      {machineIds.map(renderMachineGroup)}
      {renderUncategorizedGroup()}
    </>
  );
};

export default RecipeList;
