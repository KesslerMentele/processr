
import { createGraph } from "../utils/graph-factory.ts";
import { exportPackToFile, importPackFromFile } from "../utils/pack-io.ts";
import { buildGamePackIndex } from "../utils/game-pack-index.ts";
import { useProcessrStore } from "../state/store.ts";
import { saveGamePack } from "../utils/persistence.ts";
import type { FC } from "react";
import { DraggableNodeTemplate } from "./NodeTemplate.tsx";


const Sidebar: FC = () => {
  const selectedNodeId = useProcessrStore.use.selectedNodeId();
  const graph = useProcessrStore.use.graph();
  const selectedNode = selectedNodeId ? (graph.nodes[selectedNodeId] ?? null) : null;
  const packIndex = useProcessrStore.use.packIndex();
  const setNodeRecipe = useProcessrStore.use.setNodeRecipe();
  const loadGraph = useProcessrStore.use.loadGraph();

  const handleImport = () => {
    void importPackFromFile().then((pack) => {
      loadGraph(createGraph(pack.id, pack.name), buildGamePackIndex(pack));
      saveGamePack(pack);
    });
  };



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
      <h1>Select a Recipe:</h1>
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

  const PackPicker = (
    <div className="sidebar__pack">
      <span className="sidebar__pack-name">{packIndex.pack.name}</span>
      <button onClick={handleImport}>Import pack</button>
      <button onClick={() => {
        exportPackToFile(packIndex.pack);
      }}>Export Pack</button>
    </div>
  );

  return (
    <div className="sidebar">
      {NodePicker}
      <hr/>
      {RecipePicker}
      <hr/>
      {PackPicker}
    </div>
  );
};

export default Sidebar;
