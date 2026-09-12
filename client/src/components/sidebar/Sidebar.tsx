import NodePicker from "./NodePicker.tsx";
import RecipePicker from "./RecipePicker.tsx";
import DevTools from "./DevTools.tsx";
import "./sidebar.css";
import type { FC } from "react";
import { useContextMenu } from "../../hooks/useContextMenu.ts";
import type { MouseEvent } from "react";
import { logger } from "../../utils/logger.ts";

const Sidebar: FC = () => {
  const { toggleContextMenu } = useContextMenu();

  return (
    <div
      className="sidebar"
      onContextMenu={(e: MouseEvent) => {
        e.preventDefault();
        toggleContextMenu({
          x: e.clientX,
          y: e.clientY,
          data: { target: "Sidebar" },
          items: [
            { label: 'Add Node', onClick: () => { logger.debug('[Sidebar] Add Node clicked — not wired yet'); } },
          ],
        });
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
