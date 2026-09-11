import { useContextMenu } from "../hooks/useContextMenu.ts";


const ContextMenu = () => {
  const { contextMenuData, toggleContextMenu } = useContextMenu();

  if (!contextMenuData) {
    return null;
  }


  return (

    <div
      className="contextMenu"
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
      <h2>{contextMenuData.data}</h2>
    </div>
  );
};

export default ContextMenu;