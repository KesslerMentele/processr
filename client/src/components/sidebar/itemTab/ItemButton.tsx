import type { Item } from "../../../models";
import type { FC } from "react";


const ItemButton: FC<Item> = (item) => {
  return (
    <button key={item.id} className="sidebar-btn">
      {item.name}
      <img src={item.display.icon} alt="" className="item-icon" title={item.name} />
    </button>
  );
};

export default ItemButton;