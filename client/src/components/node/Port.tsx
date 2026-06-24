import { Handle } from "@xyflow/react";
import { Position as RFPosition } from "@xyflow/react";
import type { Item, PortInstance } from "../../models";
import type { FC } from "react";
import PortIcon from "./PortIcon.tsx";

const Port: FC<PortInstance> = ({ template, item, id }:PortInstance) => {
  const rfType = template.direction === "input" ? "target" : "source";

  const portClass = (item: Item | undefined) =>
    ['port-handle', item && 'port-handle-has-item', item?.form && `port-handle-${item.form}`]
    .filter(Boolean).join(' ');

  return (
    <Handle
      key={id}
      id={id}
      title={item ? item.name : template.name}
      type={rfType}
      position={template.direction === "input" ? RFPosition.Left : RFPosition.Right }
      style={{ top: `${String((template.position ?? 0.5) * 100)}%` }}
      className={portClass(item)}
    >
      {item !== undefined && <PortIcon {...item}/>}
    </Handle>
  );
};

export default Port;