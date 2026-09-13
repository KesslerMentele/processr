import "./sidebarContainer.css";
import { useRef, type FC } from "react";
import type { MouseEvent } from "react";
import SidebarTabs from "./SidebarTabs.tsx";
import { useProcessrStore } from "../../state/store.ts";
import DevTools from "./DevTools.tsx";
import NodesTab from "./NodesTab.tsx";
import RecipesTab from "./RecipesTab.tsx";
import ItemsTab from "./ItemsTab.tsx";

const COLLAPSED_WIDTH = 30;
const DEFAULT_WIDTH = 231;

const SidebarContainer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTab = useProcessrStore.use.currentSidebarTab();
  const sidebarOpen = useProcessrStore.use.sidebarOpen();
  const setSidebarVisibility = useProcessrStore.use.setSidebarVisibility();
  const setTab = useProcessrStore.use.setSidebarTab();
  const prevTab = useProcessrStore.use.prevSidebarTab();
  const currentWidth = useProcessrStore.use.currentSidebarWidth();
  const setSidebarWidth = useProcessrStore.use.setSidebarWidth();

  const onResizerMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = containerRef.current?.getBoundingClientRect().width ?? currentWidth;

    const onMove = (ev: globalThis.MouseEvent) => {
      const calculatedWidth = Math.min(Math.max(startWidth + (ev.clientX - startX), COLLAPSED_WIDTH), 500);
      setSidebarWidth(calculatedWidth);
      if (!sidebarOpen) {
        setSidebarVisibility(true);
        setTab(prevTab);
      }
    };

    const onUp = () => {
      if (currentWidth < 100 && sidebarOpen) {
        setTab(null);
        setSidebarVisibility(false);
        setSidebarWidth(DEFAULT_WIDTH);
      }

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
    case null: { return null; }
    }
  };

  const onResizerDoubleClick = () => {
    if (sidebarOpen) {
      setTab(null);
      setSidebarVisibility(false);
    } else {
      setSidebarVisibility(true);
      setTab(prevTab);
    }
  };

return (
    <div
      className="sidebar-container"
      ref={containerRef}
      style={{ width: sidebarOpen ? `${currentWidth.toString()}px` : `${COLLAPSED_WIDTH.toString()}px` }}
    >
      <SidebarTabs/>
      {sidebarOpen &&
        <div className="sidebar">
          {getSidebarContent()}
          <hr/>
          <DevTools/>
        </div>
      }
      <div className="sidebar-resizer" onMouseDown={onResizerMouseDown} onDoubleClick={onResizerDoubleClick} ></div>
    </div>
  );
};

export default SidebarContainer;
