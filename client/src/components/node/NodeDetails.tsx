import type { FC } from "react";
import type { PortEntry, Recipe } from "../../models";
import PortIcon from "./PortIcon";

interface NodeDetailsProps {
  inputs: PortEntry[];
  outputs: PortEntry[];
  recipe: Recipe;
  count: number
}

const NodeDetails: FC<NodeDetailsProps> = ({ inputs, outputs, recipe, count }) => {
  return (
     <div className="processr-node-details">
        {inputs.map(({ port, item, stack }) => item && stack && (

          <div key={port.id} className="processr-node-detail-row">
            <PortIcon {...item}/>
            <span className="processr-node-detail-name">{item.name}</span>
            <span className="processr-node-detail-amount">×{stack.amount * count}</span>
          </div>
        ))}

        {inputs.length > 0 ? <div className="processr-node-detail-sep"/> : null}

        {outputs.map(({ port, item, stack }) => item && stack && (
          <div key={port.id} className="processr-node-detail-row processr-node-detail-row-out">
            <PortIcon {...item}/>
            <span className="processr-node-detail-name">{item.name}</span>
            <span className="processr-node-detail-amount">×{stack.amount * count}</span>
          </div>
        ))}
        <div className="processr-node-detail-duration">{recipe.duration}s cycle</div>
      </div>
  );
};

export default NodeDetails