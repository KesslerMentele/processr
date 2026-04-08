import type { CSSProperties, FC } from "react";
import type { ProcessrNodeData } from "../../models";
import { type Node as RFNode, type NodeProps as RFNodeProps } from "@xyflow/react";
import { getInputPorts, getOutputPorts } from "../../utils/node-utils.ts";
import { useNodeComponentState } from "../../hooks/useNodeComponentState.ts";
import type { PortEntry } from "../../models";
import Port from "./Port.tsx";
import PortIcon from "./PortIcon.tsx";
import { logger } from "../../utils/logger.ts";

type ProcessrNodeComponentProps = RFNodeProps<RFNode<ProcessrNodeData>>

const ProcessrNodeComponent: FC<ProcessrNodeComponentProps> = ({ data, selected }) => {
  const { packIndex, detailedMode } = useNodeComponentState();
  const template = packIndex.nodeTemplatesById.get(data.templateId);
  const recipe = data.recipeId === null ? undefined : packIndex.recipesById.get(data.recipeId);

  if (template === undefined) {
    logger.warn(`[ProcessrNode] template not found: ${data.templateId} — Atlas may be missing this node type`);
    return (
      <div className={`processr-node processr-node-error ${selected ? 'selected' : ''}`}>
        <div className="processr-node-label">Unknown node</div>
        <div className="processr-node-error-detail">Missing from Atlas: <code>{data.templateId}</code></div>
      </div>
    );
  }

  const inputs: PortEntry[] = getInputPorts(template).map((port, i): PortEntry  => ({
      port,
      stack: recipe?.inputs[i],
      item: recipe ? packIndex.itemsById.get(recipe.inputs[i]?.itemId) : undefined,
    }));

  const outputs: PortEntry[] = getOutputPorts(template).map((port, i): PortEntry => ({
      port,
      stack: recipe?.outputs[i],
      item: recipe ? packIndex.itemsById.get(recipe.outputs[i]?.itemId) : undefined,
    }));

  return (
    <div
      className={`processr-node ${selected ? "selected" : ""}`}
      style={{ '--node-accent': template.display.color ?? '#3b6ea5' } as CSSProperties}
    >
      {inputs.map((p, i) => (<Port key={i} {...p} />))}
      <div className="processr-node-label">{data.label ?? template.name}</div>
      {recipe && (
        <div className="processr-node-recipe">{recipe.name}</div>
      )}

      {detailedMode && recipe &&
        <div className="processr-node-details">
          {inputs.map(({ port, item, stack }) => item && stack && (

            <div key={port.id} className="processr-node-detail-row">
              <PortIcon {...item}/>
              <span className="processr-node-detail-name">{item.name}</span>
              <span className="processr-node-detail-amount">×{stack.amount}</span>
            </div>
          ))}
          {inputs.length > 0 ? <div className="processr-node-detail-sep"/> : null}
          {outputs.map(({ port, item, stack }) => item && stack && (
            <div key={port.id} className="processr-node-detail-row processr-node-detail-row-out">
              <PortIcon {...item}/>
              <span className="processr-node-detail-name">{item.name}</span>
              <span className="processr-node-detail-amount">×{stack.amount}</span>
            </div>
          ))}
          <div className="processr-node-detail-duration">{recipe.duration}s cycle</div>
        </div>
      }

      {outputs.map(p => (<Port {...p} />))}
    </div>
  );
};
export default ProcessrNodeComponent;