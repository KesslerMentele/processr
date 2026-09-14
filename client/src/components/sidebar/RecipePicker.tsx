import type { NodeTemplateId, ProcessrNode } from "../../models";
import { useSidebarState } from "../../hooks/useSidebarState.ts";
import RecipeGroup from "./RecipeGroup.tsx";


const RecipePicker = () => {
  const { selectedNodes } = useSidebarState();

  if (selectedNodes.length === 0) return <div className="sidebar-recipes" />;

  // Multi-select: group by templateId
  const groupsObj = selectedNodes.reduce<Record<NodeTemplateId, ProcessrNode[]>>((acc, n) => ({
    ...acc,
    [n.templateId]: [...(acc[n.templateId] ?? []), n],
  }), {});



  return (
    <div className="sidebar-recipes">
      {Object.entries(groupsObj).map(([templateId, nodes]) =>
        <RecipeGroup templateId={templateId as NodeTemplateId} nodes={nodes} />)
      };
    </div>
  );
};

export default RecipePicker;