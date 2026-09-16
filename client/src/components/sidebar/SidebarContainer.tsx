import "./sidebarContainer.css";
import { useEffect, useRef, type FC } from "react";
import type { MouseEvent } from "react";
import SidebarTabs from "./SidebarTabs.tsx";
import { useProcessrStore } from "../../state/store.ts";
import DevTools from "./DevTools.tsx";
import NodeTab from "./nodeTab/NodeTab.tsx";
import RecipeTab from "./recipeTab/RecipeTab.tsx";
import ItemTab from "./itemTab/ItemTab.tsx";

const COLLAPSED_WIDTH = 30;
const DEFAULT_WIDTH = 231;
const COLLAPSE_THRESHOLD = 100;
const MAX_WIDTH = 1000;

const SidebarContainer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTab = useProcessrStore.use.currentSidebarTab();
  const sidebarOpen = useProcessrStore.use.sidebarOpen();
  const setSidebarVisibility = useProcessrStore.use.setSidebarVisibility();
  const setTab = useProcessrStore.use.setSidebarTab();
  const prevTab = useProcessrStore.use.prevSidebarTab();
  const currentWidth = useProcessrStore.use.currentSidebarWidth();
  const setSidebarWidth = useProcessrStore.use.setSidebarWidth();

  const sidebarOpenRef = useRef(sidebarOpen);
  const currentWidthRef = useRef(currentWidth);
  const prevTabRef = useRef(prevTab);

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    sidebarOpenRef.current = sidebarOpen;
    // eslint-disable-next-line functional/immutable-data
    currentWidthRef.current = currentWidth;
    // eslint-disable-next-line functional/immutable-data
    prevTabRef.current = prevTab;
  });

  const onResizerMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = containerRef.current?.getBoundingClientRect().width ?? currentWidth;

    const onMove = (ev: globalThis.MouseEvent) => {
      const calculatedWidth = Math.min(Math.max(startWidth + (ev.clientX - startX), COLLAPSED_WIDTH), MAX_WIDTH);
      setSidebarWidth(calculatedWidth);
      if (!sidebarOpenRef.current) {
        setSidebarVisibility(true);
        setTab(prevTabRef.current);
      }
    };

    const onUp = () => {
      if (currentWidthRef.current < COLLAPSE_THRESHOLD && sidebarOpenRef.current) {
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
    case "Recipe": { return (<RecipeTab/>); }
    case "Node": { return (<NodeTab/>); }
    case "Item": { return (<ItemTab/>); }
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
