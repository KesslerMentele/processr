import type { NodeTemplateId } from "../../../models";
import { type FC, type MouseEvent, useState } from "react";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";
import { useProcessrStore } from "../../../state/store.ts";
import SidebarGroup from "../SidebarGroup.tsx";
import AddRecipeForm from "./AddRecipeForm.tsx";
import RecipeButton from "./RecipeButton.tsx";


interface RecipeMachineGroupProps {
  machineId: NodeTemplateId;
}

const RecipeMachineGroup: FC<RecipeMachineGroupProps> = ({ machineId }) => {
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const { toggleContextMenu } = useContextMenu();
  const atlasIndex = useProcessrStore.use.atlasIndex();


  const { nodeTemplatesById, recipesByNodeType } = atlasIndex;
  
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
  
  
  const recipes = recipesByNodeType.get(machineId) ?? [];
  if (recipes.length === 0) return null;
  const template = nodeTemplatesById.get(machineId);
  return (
    <SidebarGroup key={machineId} title={template?.name ?? machineId} onContextMenu={onContextMenu}>
      {isAddingRecipe &&
          <>
              <AddRecipeForm onClose={() => { setIsAddingRecipe(false); }} /> <hr/>
          </>
      }
      {recipes.map((recipe) => <RecipeButton recipe={recipe}/>)}
    </SidebarGroup>
  );
};

export default RecipeMachineGroup;