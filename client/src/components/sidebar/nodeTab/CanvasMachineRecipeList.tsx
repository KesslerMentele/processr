import type { NodeTemplateId, ProcessrNode, ProcessrNodeId, RecipeId } from "../../../models";
import { useSidebarState } from "../../../hooks/useSidebarState.ts";
import type { FC } from "react";
import SidebarGroup from "../SidebarGroup.tsx";

interface MachineRecipeListProps {
  templateId: string;
  nodes: ProcessrNode[];
}

const CanvasMachineRecipeList: FC<MachineRecipeListProps> = ({ templateId, nodes }) => {
  const { packIndex, setNodeRecipes } = useSidebarState();

  const template = packIndex.nodeTemplatesById.get(templateId as NodeTemplateId);
  const recipes = packIndex.recipesByNodeType.get(templateId as NodeTemplateId) ?? [];

  const onRecipeClicked = (nodeIds: ProcessrNodeId[], recipeId: RecipeId, allActive: boolean) => {
    setNodeRecipes(nodeIds.map(nodeId => ({ nodeId, recipeId: allActive ? null : recipeId })));
  };

    return (
      <div key={templateId} >
        <hr/>
        <SidebarGroup title={template?.name ?? templateId}>
          {recipes.map(recipe => {
            const allActive = nodes.every(n => n.recipeId === recipe.id);
            return (
              <button
                key={recipe.id}
                className={`sidebar-btn sidebar-recipe-btn ${allActive ? "active" : ""}`}
                onClick={() => {
                  onRecipeClicked(nodes.map(n => n.id), recipe.id, allActive);
                }}
              >
                {recipe.name}
              </button>
            );
          })}
        </SidebarGroup>
      </div>
    );

};

export default CanvasMachineRecipeList;