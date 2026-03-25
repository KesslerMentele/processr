import {PortDirection, type ProcessorNodeData} from "../models";
import {Handle, type Node as RFNode, type NodeProps as RFNodeProps, Position as RFPosition} from "@xyflow/react";
import {useGraphState} from "../state/useGraph.ts";


const ProcessrNodeComponent = ({ data, selected }:RFNodeProps<RFNode<ProcessorNodeData>>) => {
  const { packIndex } = useGraphState();
  const template = packIndex.nodeTemplatesById.get(data.templateId);
  const recipe = data.recipeId === null ? undefined : packIndex.recipesById.get(data.recipeId);

  if (template === undefined) return null;

  return (
    <div className={`processr-node ${selected ? "selected" : ""}`}>

      {template.ports.filter(p => p.direction === PortDirection.Input).map(p => (
        <Handle key={p.id} id={p.id} type={"target"} position={RFPosition.Left}/>
      ))}

      <div className={"processr-node__label"}>{data.label ?? template.name}</div>

      {recipe !== undefined && (
        <div className={"processr-node__recipe"}>{recipe.name}</div>
      )}

      {template.ports.filter(p => p.direction === PortDirection.Output).map(p => (
        <Handle key={p.id} id={p.id} type={"source"} position={RFPosition.Right}/>
      ))}

    </div>
  )
}
export default ProcessrNodeComponent;