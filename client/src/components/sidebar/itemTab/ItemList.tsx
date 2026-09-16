import type { FC } from "react";
import type { ItemId } from "../../../models";
import { useProcessrStore } from "../../../state/store.ts";
import ItemButton from "./ItemButton.tsx";

interface ItemListProps {
  onEdit: (id: ItemId) => void;
}

const ItemList: FC<ItemListProps> = ({ onEdit }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();

  return (
    <>
      {atlasIndex.atlas.items.map(item => (
      <ItemButton {...item} key={item.id} onEdit={() => { onEdit(item.id); }}/>
      ))}
    </>
  );
};


export default ItemList;