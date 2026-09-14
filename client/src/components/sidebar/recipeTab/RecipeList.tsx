import { useProcessrStore } from "../../../state/store.ts";
import type { NodeTemplateId, Recipe } from "../../../models";
import SidebarGroup from "../SidebarGroup.tsx";

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
      <SidebarGroup key={machineId} title={template?.name ?? machineId}>
        {recipes.map(renderRecipeButton)}
      </SidebarGroup>
    );
  };

  const renderUncategorizedGroup = () => {
    if (uncategorizedRecipes.length === 0) return null;
    return (
      <SidebarGroup title={UNCATEGORIZED_LABEL}>
        {uncategorizedRecipes.map(renderRecipeButton)}
      </SidebarGroup>
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
