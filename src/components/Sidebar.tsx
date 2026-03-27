import type {FC} from "react";
import {createGraph, createProcessorNode} from "../utils/graph-factory.ts";
import {exportPackToFile, importPackFromFile} from "../utils/pack-io.ts";
import {useGraphStore} from "../state/graph-store.ts";
import {buildGamePackIndex} from "../utils/game-pack-index.ts";


const Sidebar: FC = () => {
  const selectedNodeId = useGraphStore.use.selectedNodeId()
  const selectedNode = useGraphStore.use.graph().nodes.find(node => node.id === selectedNodeId)
  const packIndex = useGraphStore.use.packIndex()
  const addNode = useGraphStore.use.addNode();
  const setNodeRecipe = useGraphStore.use.setNodeRecipe();
  const handleImport = () => {
    void importPackFromFile().then((pack) => {
      useGraphStore.getState().loadGraph(
        createGraph(pack.id, pack.name),
        buildGamePackIndex(pack)
      )
    })
  }


  const compatibleRecipes = selectedNode
    ? (packIndex.recipesByNodeType.get(selectedNode.templateId) ?? [])
    : [];


  return (
    <div className="sidebar">
      <div className="sidebar__nodetemplates">
        <h1>Nodes</h1>
        {packIndex.pack.nodeTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => {
              addNode(createProcessorNode( template, {x:100, y:100}))
            }}
          >
            {template.name}
          </button>
        ))}
      </div>
      <hr/>
      <div className="sidebar__recipes">
        <h1>Select a Recipe:</h1>
        {selectedNode && compatibleRecipes.map(recipe => (
            <button
              key={recipe.id}
              className={selectedNode.recipeId === recipe.id ? "active" : ""}
              onClick={() => {
                setNodeRecipe(selectedNode.id, recipe.id)
              }}
            >
              {recipe.name}
            </button>
          ))}
      </div>
      <hr/>
      <div className="sidebar__pack">
        <span className="sidebar__pack-name">{packIndex.pack.name}</span>
        <button onClick={handleImport}>Import pack</button>
        <button onClick={() => {
          exportPackToFile(packIndex.pack)
        }}>Export Pack</button>
      </div>
    </div>
  )
}

export default Sidebar;
