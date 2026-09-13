import type { NodeTemplateId, ProcessrNode } from "../../models";
import { useSidebarState } from "../../hooks/useSidebarState.ts";
import CanvasMachineRecipeList from "./CanvasMachineRecipeList.tsx";


const RecipeSelector = () => {
  const { selectedNodes } = useSidebarState();

  if (selectedNodes.length === 0) return <div className="sidebar-recipes" />;

  // Multi-select: group by templateId
  const groupsObj = selectedNodes.reduce<Record<NodeTemplateId, ProcessrNode[]>>((acc, n) => ({
    ...acc,
    [n.templateId]: [...(acc[n.templateId] ?? []), n],
  }), {});



  return (
    <div className="sidebar-list-container sidebar-recipe-picker">
      {Object.entries(groupsObj).map(([templateId, nodes]) =>
        <CanvasMachineRecipeList templateId={templateId} nodes={nodes} />
      )}
    </div>
  );
};

export default RecipeSelector;