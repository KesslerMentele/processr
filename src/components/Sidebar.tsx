import {
  type ProcessrNodeId,
} from "../models";
import type {FC} from "react";
import {useGraphDispatch, useGraphState, useLoadPack} from "../state/useGraph.ts";
import {createProcessorNode} from "../utils/graph-factory.ts";
import {exportPackToFile, importPackFromFile} from "../utils/pack-io.ts";

interface SidebarProps {
  readonly selectedNodeId: ProcessrNodeId | null;
}


const Sidebar: FC<SidebarProps> = ({ selectedNodeId }) => {
  const {state, packIndex } = useGraphState();
  const dispatch = useGraphDispatch();
  const loadPack = useLoadPack()
  const handleImport = () => { void importPackFromFile().then(loadPack)}

  const selectedNode = state.nodes.find((n) => n.id === selectedNodeId)
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
            onClick={() => {dispatch( {type: "ADD_NODE", node: createProcessorNode( template, {x:100, y:100} ) } )}}
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
                dispatch({type: "SET_NODE_RECIPE", nodeId: selectedNode.id, recipeId: recipe.id})
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
