import { useSidebarState } from "../../hooks/useSidebarState.ts";


const RecipePicker = () => {
  const { packIndex, graph, setNodeRecipe, selectedNodeId } = useSidebarState();

  const selectedNode = selectedNodeId ? (graph.nodes[selectedNodeId] ?? null) : null;

  const compatibleRecipes = selectedNode ? (packIndex.recipesByNodeType.get(selectedNode.templateId) ?? []) : [];

  return (
    <div className="sidebar-recipes">

      {selectedNode && <h1>Select a Recipe:</h1>}

      {selectedNode && compatibleRecipes.map(recipe => (
        <button
          key={recipe.id}
          className={`sidebar-recipe-btn${selectedNode.recipeId === recipe.id ? " active" : ""}`}
          onClick={() => {
            setNodeRecipe(selectedNode.id, recipe.id);
          }}
        >
          {recipe.name}
        </button>
      ))}
    </div>);
};

export default RecipePicker;