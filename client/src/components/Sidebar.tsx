import { useProcessrStore } from "../state/store.ts";
import type { FC } from "react";
import { DraggableNodeTemplate } from "./NodeTemplate.tsx";


const Sidebar: FC = () => {
  const selectedNodeId = useProcessrStore.use.selectedNodeId();
  const graph = useProcessrStore.use.graph();
  const selectedNode = selectedNodeId ? (graph.nodes[selectedNodeId] ?? null) : null;
  const packIndex = useProcessrStore.use.packIndex();
  const setNodeRecipe = useProcessrStore.use.setNodeRecipe();


    const compatibleRecipes = selectedNode
    ? (packIndex.recipesByNodeType.get(selectedNode.templateId) ?? [])
    : [];

  const NodePicker =  (
    <div className="sidebar__nodetemplates">
      <h1>Nodes</h1>
      {packIndex.pack.nodeTemplates.map(template => (
        <DraggableNodeTemplate key={template.id} template={template}/>
      ))}
    </div>
  );

  const RecipePicker = (
    <div className="sidebar__recipes">
      {selectedNode && <h1>Select a Recipe:</h1>}
      {selectedNode && compatibleRecipes.map(recipe => (
        <button
          key={recipe.id}
          className={selectedNode.recipeId === recipe.id ? "active" : ""}
          onClick={() => {
            setNodeRecipe(selectedNode.id, recipe.id);
          }}
        >
          {recipe.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="sidebar">
      {NodePicker}
      <hr/>
      {RecipePicker}
    </div>
  );
};

export default Sidebar;
