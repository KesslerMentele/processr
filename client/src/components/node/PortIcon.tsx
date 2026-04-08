import type { FC } from "react";
import type { Item } from "../../models";

const PortIcon: FC<Item> = (item) => {
  return (
    item.display.icon
    ? <img src={item.display.icon} alt="" className="port-icon" title={item.name} />
    : <span className="port-icon port-icon--color" style={{ background: item.display.color ?? "#888" }} title={item.name} />
  );
};

export default PortIcon;