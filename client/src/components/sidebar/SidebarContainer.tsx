import "./sidebarContainer.css";
import { useRef, type FC } from "react";
import type { MouseEvent } from "react";
import SidebarTabs from "./SidebarTabs.tsx";
import { useProcessrStore } from "../../state/store.ts";
import DevTools from "./DevTools.tsx";
import NodesTab from "./NodesTab.tsx";
import RecipesTab from "./RecipesTab.tsx";
import ItemsTab from "./ItemsTab.tsx";

const SidebarContainer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTab = useProcessrStore.use.currentSidebarTab();


  const onResizerMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const startWidth = container.getBoundingClientRect().width;

    const onMove = (ev: globalThis.MouseEvent) => {
      // eslint-disable-next-line functional/immutable-data
      container.style.width = `${Math.min(Math.max(startWidth + (ev.clientX - startX), 150), 500) .toString()}px`;
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };


  const getSidebarContent = () => {
    switch (currentTab) {
    case "Recipe": { return (<RecipesTab/>); }
    case "Node": { return (<NodesTab/>); }
    case "Item": { return (<ItemsTab/>); }
    }
  };

return (
    <div
      className="sidebar-container"
      ref={containerRef}
    >
      <SidebarTabs/>
      <div className="sidebar">
        {getSidebarContent()}
        <hr/>
        <DevTools/>
      </div>
      <div className="sidebar-resizer" onMouseDown={onResizerMouseDown}></div>
    </div>
  );
};

export default SidebarContainer;
