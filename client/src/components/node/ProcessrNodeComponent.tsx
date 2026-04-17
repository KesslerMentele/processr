import {type CSSProperties, type FC} from "react";
import type { ProcessrNodeData } from "../../models";
import { type Node as RFNode, type NodeProps as RFNodeProps } from "@xyflow/react";
import { getInputPorts, getOutputPorts } from "../../utils/node-utils.ts";
import { useNodeComponentState } from "../../hooks/useNodeComponentState.ts";
import type { PortEntry } from "../../models";
import Port from "./Port.tsx";
import { logger } from "../../utils/logger.ts";
import NodeDetails from "./NodeDetails.tsx";
import NodeStackCount from "./NodeStackCount.ts";

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
      <div className="processr-node-label">

        <p>{data.label ?? template.name}</p>

        <NodeStackCount id={data.id} count={data.count} />

      </div>
      {recipe && (
        <div className="processr-node-recipe">{recipe.name}</div>
      )}

      {detailedMode && recipe && <NodeDetails recipe={recipe} count={data.count} inputs={inputs} outputs={outputs} />}

      {outputs.map((p, i) => (<Port key={i} {...p} />))}
    </div>
  );
};
export default ProcessrNodeComponent;