import { Handle } from "@xyflow/react";
import { Position as RFPosition } from "@xyflow/react";
import type { Item, PortEntry } from "../../models";
import type { FC } from "react";
import PortIcon from "./PortIcon.tsx";

const Port: FC<PortEntry> = ({ port, item }:PortEntry) => {
  const rfType = port.direction === "input" ? "target" : "source";

  const portClass = (item: Item | undefined) =>
    ['port-handle', item && 'port-handle-has-item', item?.form && `port-handle-${item.form}`]
    .filter(Boolean).join(' ');

  return (
    <Handle
      key={port.id}
      id={port.id}
      title={item ? item.name : port.name}
      type={rfType}
      position={port.direction === "input" ? RFPosition.Left : RFPosition.Right }
      style={{ top: `${String((port.position ?? 0.5) * 100)}%` }}
      className={portClass(item)}
    >
      {item !== undefined && <PortIcon {...item}/>}
    </Handle>
  );
};

export default Port;