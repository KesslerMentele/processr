import type { Item, PortDefinition, RecipeItemStack, ProcessrNodeData } from "../models";
import { Handle, type Node as RFNode, type NodeProps as RFNodeProps, Position as RFPosition } from "@xyflow/react";
import { useProcessrStore } from "../state/store.ts";
import { getInputPorts, getOutputPorts } from "../utils/node-utils.ts";


const PortIcon = ({ item }: { readonly item: Item | undefined }) => {
  if (item === undefined) return null;
  return item.display.icon
    ? <img src={item.display.icon} alt="" className="port-icon" title={item.name} />
    : <span className="port-icon port-icon--color" style={{ background: item.display.color ?? "#888" }} title={item.name} />;
};

interface PortEntry {
  readonly port: PortDefinition;
  readonly item: Item | undefined;
  readonly stack: RecipeItemStack | undefined;
}

const ProcessrNodeComponent = ({ data, selected }: RFNodeProps<RFNode<ProcessrNodeData>>) => {
  const packIndex = useProcessrStore.use.packIndex();
  const detailedMode = useProcessrStore.use.detailedMode();
  const template = packIndex.nodeTemplatesById.get(data.templateId);
  const recipe = data.recipeId === null ? undefined : packIndex.recipesById.get(data.recipeId);

  if (template === undefined) return null;

  const inputs: PortEntry[] = getInputPorts(template)
  .map((port, i) => ({
      port,
      stack: recipe?.inputs[i],
      item: recipe ? packIndex.itemsById.get(recipe.inputs[i]?.itemId) : undefined,
    }));

  const outputs: PortEntry[] = getOutputPorts(template)
    .map((port, i) => ({
      port,
      stack: recipe?.outputs[i],
      item: recipe ? packIndex.itemsById.get(recipe.outputs[i]?.itemId) : undefined,
    }));

  return (
    <div className={`processr-node ${selected ? "selected" : ""}`}>

      {inputs.map(({ port, item }) => (
        <Handle key={port.id} id={port.id} type="target" position={RFPosition.Left}
          style={{ top: `${String((port.position ?? 0.5) * 100)}%` }}
          className={item ? "port-handle port-handle--has-item" : "port-handle"}
        >
          <PortIcon item={item} />
        </Handle>
      ))}

      <div className="processr-node__label">{data.label ?? template.name}</div>

      {recipe !== undefined && (
        <div className="processr-node__recipe">{recipe.name}</div>
      )}

      {detailedMode && recipe !== undefined && (
        <div className="processr-node__details">
          {inputs.map(({ port, item, stack }) => item && stack && (
            <div key={port.id} className="processr-node__detail-row">
              <PortIcon item={item} />
              <span className="processr-node__detail-name">{item.name}</span>
              <span className="processr-node__detail-amount">×{stack.amount}</span>
            </div>
          ))}
          <div className="processr-node__detail-sep" />
          {outputs.map(({ port, item, stack }) => item && stack && (
            <div key={port.id} className="processr-node__detail-row processr-node__detail-row--out">
              <PortIcon item={item} />
              <span className="processr-node__detail-name">{item.name}</span>
              <span className="processr-node__detail-amount">×{stack.amount}</span>
            </div>
          ))}
          <div className="processr-node__detail-duration">{recipe.duration}s cycle</div>
        </div>
      )}

      {outputs.map(({ port, item }) => (
        <Handle key={port.id} id={port.id} type="source" position={RFPosition.Right}
          style={{ top: `${String((port.position ?? 0.5) * 100)}%` }}
          className={item ? "port-handle port-handle--has-item" : "port-handle"}
        >
          <PortIcon item={item} />
        </Handle>
      ))}

    </div>
  );
};
export default ProcessrNodeComponent;