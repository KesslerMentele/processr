import type { FC } from "react";
import type { Item } from "../../models";
import ItemIcon from "../ItemIcon.tsx";

const PortIcon: FC<Item> = (item) => (
  <ItemIcon item={item} className="port-icon" title={item.name} />
);

export default PortIcon;
