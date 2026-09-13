import { FaBook } from "react-icons/fa6";
import { FaLocationCrosshairs } from "react-icons/fa6"; // Node
import { FaGem } from "react-icons/fa6";
import { useProcessrStore } from "../../state/store.ts";
// Item


const SidebarTabs = () => {

  const setTab = useProcessrStore.use.setSidebarTab();

  return (
    <div className="sidebar-tabs">
      <button title="Nodes" onClick={() => {setTab("Node");}} ><FaLocationCrosshairs /></button>
      <button  title="Recipes" onClick={() => {setTab("Recipe");}} ><FaBook/></button>
      <button title="Items" onClick={() => {setTab("Item");}} ><FaGem /></button>
    </div>
  );
};


export default SidebarTabs;