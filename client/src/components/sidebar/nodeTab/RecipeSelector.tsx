import type { NodeTemplateId, ProcessrNode } from "../../../models";
import { useSidebarState } from "../../../hooks/useSidebarState.ts";
import CanvasMachineRecipeList from "./CanvasMachineRecipeList.tsx";


const RecipeSelector = () => {
  const { selectedNodes } = useSidebarState();

  if (selectedNodes.length === 0) return <div className="sidebar-recipes" />;

  // Multi-select: group by templateId
  const groupsObj = selectedNodes.reduce<ReadonlyMap<NodeTemplateId, ProcessrNode[]>>((acc, n) => {
    return new Map([...acc,
    [n.templateId, [...(acc.get(n.templateId) ?? []), n]]]
  );
  }, new Map());



  return (
    <div className="sidebar-list-container sidebar-recipe-picker">
      {groupsObj.entries().map(([templateId, nodes]) =>
        <CanvasMachineRecipeList templateId={templateId} nodes={nodes} key={templateId} />
      )}
    </div>
  );
};

export default RecipeSelector;