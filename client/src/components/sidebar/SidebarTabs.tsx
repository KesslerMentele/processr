import { FaBook } from "react-icons/fa6";
import { FaLocationCrosshairs } from "react-icons/fa6"; // Node
import { FaGem } from "react-icons/fa6";
import { useProcessrStore } from "../../state/store.ts";
import type { SidebarTab } from "../../models/state/ui-state.ts";

// Item


const SidebarTabs = () => {

  const selectedTab = useProcessrStore.use.currentSidebarTab();
  const openSidebar = useProcessrStore.use.openSidebar();

  const onSidebarButtonClick = (s:SidebarTab) => {
    openSidebar(s);
  };

  return (
    <div className="sidebar-tabs">
      <button title="Nodes" onClick={() => {onSidebarButtonClick("Node");}} data-selected={selectedTab === "Node"} ><FaLocationCrosshairs /></button>
      <button  title="Recipes" onClick={() => {onSidebarButtonClick("Recipe");}} data-selected={selectedTab === "Recipe"} ><FaBook/></button>
      <button title="Items" onClick={() => {onSidebarButtonClick("Item");}} data-selected={selectedTab === "Item"} ><FaGem /></button>
    </div>
  );
};


export default SidebarTabs;