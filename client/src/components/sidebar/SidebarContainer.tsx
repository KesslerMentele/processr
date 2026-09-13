import "./sidebarContainer.css";
import { useRef, type FC, useState } from "react";
import type { MouseEvent } from "react";
import SidebarTabs from "./SidebarTabs.tsx";
import { useProcessrStore } from "../../state/store.ts";
import DevTools from "./DevTools.tsx";
import NodesTab from "./NodesTab.tsx";
import RecipesTab from "./RecipesTab.tsx";
import ItemsTab from "./ItemsTab.tsx";

const SidebarContainer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevWidth, setPrevWidth] = useState(231);

  const currentTab = useProcessrStore.use.currentSidebarTab();
  const sidebarOpen = useProcessrStore.use.sidebarOpen();
  const setSidebarVisibility = useProcessrStore.use.setSidebarVisibility();

  const onResizerMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    if (!sidebarOpen) {
      setSidebarVisibility(true);
    }
    const startX = e.clientX;
    const startWidth = container.getBoundingClientRect().width;

    const onMove = (ev: globalThis.MouseEvent) => {
      const calculatedWidth = Math.min(Math.max(startWidth + (ev.clientX - startX), 30), 500);


      const newWidthInPx =  `${calculatedWidth.toString()}px`;
        // eslint-disable-next-line functional/immutable-data
      container.style.width = newWidthInPx;
      if (calculatedWidth >= 150) {
        setPrevWidth(calculatedWidth);
      }
    };

    const onUp = () => {
      const container = containerRef.current;
      if (container && container.getBoundingClientRect().width < 100) {
         setSidebarVisibility(false);
         if (prevWidth < 100) {
          setPrevWidth(231);
         }
        // eslint-disable-next-line functional/immutable-data
         container.style.width = '30px';

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
    }
  };

  const onResizerDoubleClick = () => {
    const container = containerRef.current;
    if (!container) return;
    if (sidebarOpen) {
      setPrevWidth(container.getBoundingClientRect().width);
      // eslint-disable-next-line functional/immutable-data
      container.style.width = `30px`;
    } else {
      // eslint-disable-next-line functional/immutable-data
      container.style.width = prevWidth.toString() + "px";
    }
    setSidebarVisibility(!sidebarOpen);
  };

return (
    <div
      className="sidebar-container"
      ref={containerRef}
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
