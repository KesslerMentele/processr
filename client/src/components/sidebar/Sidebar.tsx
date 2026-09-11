import NodePicker from "./NodePicker.tsx";
import RecipePicker from "./RecipePicker.tsx";
import DevTools from "./DevTools.tsx";
import "./sidebar.css";
import type { FC } from "react";
import { useContextMenu } from "../../hooks/useContextMenu.ts";
import type { MouseEvent } from "react";

const Sidebar: FC = () => {
  const { toggleContextMenu } = useContextMenu();

  return (
    <div
      className="sidebar"
      onContextMenu={(e: MouseEvent) => {
        e.preventDefault();
        toggleContextMenu({ x: e.clientX, y:e.clientY, data: "Sidebar" });
      }}
    >
      <NodePicker/>
      <hr/>
      <RecipePicker/>
      <hr/>
      <DevTools/>
    </div>
  );
};

export default Sidebar;
