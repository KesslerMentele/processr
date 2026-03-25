import {
  type ProcessorNodeId,
} from "../models";
import type {FC} from "react";
import {useGraphDispatch, useGraphState} from "../state/useGraph.ts";
import {createProcessorNode} from "../utils/graph-factory.ts";

interface SidebarProps {
  readonly selectedNodeId: ProcessorNodeId | null;
}


const Sidebar: FC<SidebarProps> = ({ selectedNodeId }) => {
  const {state, packIndex} = useGraphState();
  const dispatch = useGraphDispatch();

  const selectedNode = state.nodes.find((n) => n.id === selectedNodeId)
  const compatibleRecipes = selectedNode
    ? (packIndex.recipesByNodeType.get(selectedNode.templateId) ?? [])
    : [];


  return (
    <>
      {packIndex.pack.nodeTemplates.map(template => (
        <button
          key={template.id}
          onClick={() => {dispatch( {type: "ADD_NODE", node: createProcessorNode( template, {x:100, y:100} ) } )}}
        >
          {template.name}
        </button>
      ))}

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
    </>
  )
}

export default Sidebar;
