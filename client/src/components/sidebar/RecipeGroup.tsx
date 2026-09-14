import type { NodeTemplateId, ProcessrNode } from "../../models";
import type { FC } from "react";
import { useProcessrStore } from "../../state/store.ts";
import RecipeButton from "./RecipeButton.tsx";

interface RecipeGroupProps {
  templateId: NodeTemplateId | undefined,
  nodes: ProcessrNode[]
}

const RecipeGroup:FC<RecipeGroupProps> = ({ templateId, nodes }) => {
  const atlas = useProcessrStore.use.atlasIndex();

  const template = atlas.nodeTemplatesById.get(templateId as NodeTemplateId);
  const recipes = atlas.recipesByNodeType.get(templateId as NodeTemplateId) ?? [];
  
  return (
    <div className="sidebar-recipe-group">
      <div className="sidebar-recipe-group-header">{template?.name ?? templateId}</div>
      {recipes.map(recipe =>
        <RecipeButton recipe={recipe} nodes={nodes} />
      )}
    </div>
  );
};

export default RecipeGroup;