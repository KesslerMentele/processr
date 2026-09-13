import NodeList from "./NodeList.tsx";
import { useSidebarState } from "../../hooks/useSidebarState.ts";
import RecipeSelector from "./RecipeSelector.tsx";
import { useContextMenu } from "../../hooks/useContextMenu.ts";
import { useModal } from "../../hooks/useModal.ts";
import type { MouseEvent } from "react";

const NodesTab = () => {
  const { selectedNodeIds } = useSidebarState();
  const { toggleContextMenu } = useContextMenu();
  const { toggleModal } = useModal();

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Node`, onClick: () => {toggleModal({ type:"NewNode" });} }
      ],
    });
  };

  return (
    <>
      <div className="sidebar-list-container" onContextMenu={onContextMenu}>
        <h1>Nodes</h1>
        <NodeList/>
      </div>
      {selectedNodeIds.length > 0 ? <RecipeSelector/> : null}
    </>
  );
};

export default NodesTab;