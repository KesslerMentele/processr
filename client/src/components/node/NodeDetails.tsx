import type { FC } from "react";
import type { PortInstance, Recipe } from "../../models";
import PortIcon from "./PortIcon";

interface NodeDetailsProps {
  inputs: PortInstance[];
  outputs: PortInstance[];
  recipe: Recipe;
  count: number
}

const NodeDetails: FC<NodeDetailsProps> = ({ inputs, outputs, recipe, count }) => {
  return (
     <div className="processr-node-details">
        {inputs.map(({ template, item, stack }) => item && stack && (

          <div key={template.id} className="processr-node-detail-row">
            <PortIcon {...item}/>
            <span className="processr-node-detail-name">{item.name}</span>
            <span className="processr-node-detail-amount">×{stack.amount * count}</span>
          </div>
        ))}

        {inputs.length > 0 ? <div className="processr-node-detail-sep"/> : null}

        {outputs.map(({ template, item, stack }) => item && stack && (
          <div key={template.id} className="processr-node-detail-row processr-node-detail-row-out">
            <PortIcon {...item}/>
            <span className="processr-node-detail-name">{item.name}</span>
            <span className="processr-node-detail-amount">×{stack.amount * count}</span>
          </div>
        ))}
        <div className="processr-node-detail-duration">{recipe.duration}s cycle</div>
      </div>
  );
};

export default NodeDetails;