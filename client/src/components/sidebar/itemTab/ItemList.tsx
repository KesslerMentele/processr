import { useProcessrStore } from "../../../state/store.ts";
import ItemButton from "./ItemButton.tsx";


const ItemList =  () => {
  const atlasIndex = useProcessrStore.use.atlasIndex();

  return (
    <>
      {atlasIndex.atlas.items.map(item => (
      <ItemButton {...item} key={item.id}/>
      ))}
    </>
  );
};


export default ItemList;