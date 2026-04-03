import { useProcessrStore } from "../state/store.ts";
import type { FC } from "react";
import { DraggableNodeTemplate } from "./NodeTemplate.tsx";
import { clearGamepack, clearProcessrGraph } from "../utils/persistence.ts";


const Sidebar: FC = () => {
  const selectedNodeId = useProcessrStore.use.selectedNodeId();
  const graph = useProcessrStore.use.graph();
  const selectedNode = selectedNodeId ? (graph.nodes[selectedNodeId] ?? null) : null;
  const packIndex = useProcessrStore.use.packIndex();
  const setNodeRecipe = useProcessrStore.use.setNodeRecipe();
  const loadGraph = useProcessrStore.use.loadGraph();

  const compatibleRecipes = selectedNode
  ? (packIndex.recipesByNodeType.get(selectedNode.templateId) ?? [])
  : [];

  const handleClearGraph = () => {
    clearProcessrGraph();
    loadGraph({ packIndex });
  };
  const handleClearGamepack = () => {
    clearGamepack();
    handleClearGraph();
  };

  const NodePicker =  (<div className="sidebar-nodetemplates">
      <h1>Nodes</h1>
      {packIndex.pack.nodeTemplates.map(template => (
        <DraggableNodeTemplate key={template.id} template={template}/>
      ))}
    </div>);

  const RecipePicker = (<div className="sidebar-recipes">
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

  const DevTools = (<div className="sidebar-dev-tools">
    <button className="sidebar-dev-btn" onClick={handleClearGraph}>Clear Graph</button>
    <button className="sidebar-dev-btn sidebar-dev-btn-danger" onClick={handleClearGamepack}>Clear Saved Atlas</button>
  </div>);

    return (
    <div className="sidebar">
      {NodePicker}
      <hr/>
      {RecipePicker}
      <hr/>
      {DevTools}
    </div>
  );
};

export default Sidebar;
