import { useContextMenu } from "../../hooks/useContextMenu.ts";
import ContextMenuItem from "./ContextMenuItem.tsx";
import "./context-menu.css";


const ContextMenu = () => {
  const { contextMenuData, toggleContextMenu } = useContextMenu();

  if (!contextMenuData) {
    return null;
  }

  return (
    <div
      className="context-menu"
      style={{
        position: "fixed",
        top: `${contextMenuData.y.toString()}px`,
        left: `${contextMenuData.x.toString()}px`,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        toggleContextMenu(null);
      }}
    >
      {contextMenuData.items.map((item) => (
        <ContextMenuItem
          key={item.label}
          item={item}
          onSelect={() => {
            item.onClick();
            toggleContextMenu(null);
          }}
        />
      ))}
    </div>
  );
};

export default ContextMenu;
