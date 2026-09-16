import type { NodeTemplateId, RecipeId } from "../../../models";
import { type FC, type MouseEvent, useState } from "react";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";
import { useProcessrStore } from "../../../state/store.ts";
import { recipeToInput } from "../../../features/atlas-editor/atlas-mutations.ts";
import SidebarGroup from "../SidebarGroup.tsx";
import AddRecipeForm from "./AddRecipeForm.tsx";
import RecipeButton from "./RecipeButton.tsx";


interface RecipeMachineGroupProps {
  machineId: NodeTemplateId;
}

type RecipeFormState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; id: RecipeId };

const RecipeMachineGroup: FC<RecipeMachineGroupProps> = ({ machineId }) => {
  const [formState, setFormState] = useState<RecipeFormState>({ mode: "closed" });
  const { toggleContextMenu } = useContextMenu();
  const atlasIndex = useProcessrStore.use.atlasIndex();


  const { nodeTemplatesById, recipesById, recipesByNodeType } = atlasIndex;

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Recipe`, onClick: () => {setFormState({ mode: "add" });} }
      ],
    });
  };


  const recipes = recipesByNodeType.get(machineId) ?? [];
  if (recipes.length === 0) return null;
  const template = nodeTemplatesById.get(machineId);

  const editingRecipe = formState.mode === "edit" ? recipesById.get(formState.id) : undefined;

  return (
    <SidebarGroup key={machineId} title={template?.name ?? machineId} onContextMenu={onContextMenu}>
      {formState.mode !== "closed" &&
          <>
              <AddRecipeForm
                onClose={() => { setFormState({ mode: "closed" }); }}
                formMode={
                  formState.mode === "edit" && editingRecipe
                    ? { mode: "edit", id: formState.id, initialValues: recipeToInput(editingRecipe) }
                    : { mode: "add", initialValues: { compatibleNodeTypes: [machineId] } }
                }
              /> <hr/>
          </>
      }
      {recipes.map((recipe) => (
        <RecipeButton
          key={recipe.id}
          recipe={recipe}
          onEdit={() => { setFormState({ mode: "edit", id: recipe.id }); }}
        />
      ))}
    </SidebarGroup>
  );
};

export default RecipeMachineGroup;