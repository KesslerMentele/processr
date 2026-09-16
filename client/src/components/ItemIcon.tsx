import type { FC } from "react";
import type { Item } from "../models";

interface ItemIconProps {
  item: Item;
  className: string;
  title?: string;
}

const ItemIcon: FC<ItemIconProps> = ({ item, className, title }) => (
  item.display.icon
  ? <img src={item.display.icon} alt="" className={className} title={title} />
  : <span className={`${className} ${className}--color`} style={{ background: item.display.color ?? "#888" }} title={title} />
);

export default ItemIcon;
