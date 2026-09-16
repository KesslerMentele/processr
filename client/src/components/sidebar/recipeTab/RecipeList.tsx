import { type MouseEvent, useState } from "react";
import type { RecipeId } from "../../../models";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";
import { useProcessrStore } from "../../../state/store.ts";
import { recipeToInput } from "../../../features/atlas-editor/atlas-mutations.ts";
import SidebarGroup from "../SidebarGroup.tsx";
import AddRecipeForm from "./AddRecipeForm.tsx";
import RecipeButton from "./RecipeButton.tsx";
import RecipeMachineGroup from "./RecipeMachineGroup.tsx";

const UNCATEGORIZED_LABEL = "Uncategorized";

type RecipeFormState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; id: RecipeId };

const RecipeList = () => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const { atlas, recipesById, nodeTemplatesById, recipesByNodeType } = atlasIndex;
  const { toggleContextMenu } = useContextMenu();
  const [formState, setFormState] = useState<RecipeFormState>({ mode: "closed" });

  const machineIds = [...nodeTemplatesById.keys()];

  const categorizedRecipeIds = new Set(
    machineIds.flatMap((machineId) => (recipesByNodeType.get(machineId) ?? []).map((recipe) => recipe.id))
  );
  const uncategorizedRecipes = atlas.recipes.filter((recipe) => !categorizedRecipeIds.has(recipe.id));

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Recipe`, onClick: () => { setFormState({ mode: "add" }); } }
      ],
    });
  };

  const editingRecipe = formState.mode === "edit" ? recipesById.get(formState.id) : undefined;

  const renderUncategorizedGroup = () => {
    if (uncategorizedRecipes.length === 0) return null;
    return (
      <SidebarGroup title={UNCATEGORIZED_LABEL} onContextMenu={onContextMenu}>
        {formState.mode !== "closed" &&
          <>
            <AddRecipeForm
              onClose={() => { setFormState({ mode: "closed" }); }}
              formMode={
                formState.mode === "edit" && editingRecipe
                  ? { mode: "edit", id: formState.id, initialValues: recipeToInput(editingRecipe) }
                  : { mode: "add" }
              }
            /> <hr/>
          </>
        }
        {uncategorizedRecipes.map((recipe) => (
          <RecipeButton
            key={recipe.id}
            recipe={recipe}
            onEdit={() => { setFormState({ mode: "edit", id: recipe.id }); }}
          />
        ))}
      </SidebarGroup>
    );
  };

  return (
    <>
      {machineIds.map((machineId) => <RecipeMachineGroup key={machineId} machineId={machineId}/>)}
      {renderUncategorizedGroup()}
    </>
  );
};

export default RecipeList;
