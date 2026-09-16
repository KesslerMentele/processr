import type { Item } from "../../../models";
import type { FC } from "react";
import ItemIcon from "../../ItemIcon.tsx";
import { FaCirclePlus } from "react-icons/fa6";

interface ResourceSearchRowProps {
  item: Item;
  onAddInput: () => void;
  onAddOutput: () => void;
}

const ResourceSearchRow: FC<ResourceSearchRowProps> = ({ item, onAddInput, onAddOutput }) => (
  <div className="sidebar-resource-search-row">
    <ItemIcon item={item} className="sidebar-resource-search-icon" />
    <span className="sidebar-resource-search-name">{item.name}</span>
    <button type="button" className="sidebar-btn sidebar-resource-add-btn" onClick={onAddInput}>
      <FaCirclePlus/> In
    </button>
    <button type="button" className="sidebar-btn sidebar-resource-add-btn" onClick={onAddOutput}>
      <FaCirclePlus/> Out
    </button>
  </div>
);

export default ResourceSearchRow;