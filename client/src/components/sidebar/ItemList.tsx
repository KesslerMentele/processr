import { useProcessrStore } from "../../state/store.ts";


const ItemList =  () => {
  const atlasIndex = useProcessrStore.use.atlasIndex();

  return (
    <>
      {atlasIndex.atlas.items.map(item => (
        <button key={item.id} className="sidebar-btn">
          {item.name} <img src={item.display.icon} alt="" className="port-icon" title={item.name} />
        </button>
      ))}
    </>
  );
};


export default ItemList;