import type { NodeTemplateId, ProcessrNode, ProcessrNodeId, RecipeId } from "../../models";
import { useSidebarState } from "../../hooks/useSidebarState.ts";


const RecipePicker = () => {
  const { packIndex, selectedNodes, setNodeRecipes } = useSidebarState();

  if (selectedNodes.length === 0) return <div className="sidebar-recipes" />;

  // Multi-select: group by templateId
  const groupsObj = selectedNodes.reduce<Record<NodeTemplateId, ProcessrNode[]>>((acc, n) => ({
    ...acc,
    [n.templateId]: [...(acc[n.templateId] ?? []), n],
  }), {});

  const onRecipeClicked = (nodeIds: ProcessrNodeId[], recipeId: RecipeId, allActive: boolean) => {
    setNodeRecipes(nodeIds.map(nodeId => ({ nodeId, recipeId: allActive ? null : recipeId })));
  };

  return (
    <div className="sidebar-list-container sidebar-recipe-picker">
      {Object.entries(groupsObj).map(([templateId, nodes]) => {
        const template = packIndex.nodeTemplatesById.get(templateId as NodeTemplateId);
        const recipes = packIndex.recipesByNodeType.get(templateId as NodeTemplateId) ?? [];
        return (
          <>
            <hr/>
            <div key={templateId} className="sidebar-recipe-group">
              <div className="sidebar-recipe-group-header">{template?.name ?? templateId}</div>
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
            </div>
          </>
        );
      })}
    </div>
  );
};

export default RecipePicker;