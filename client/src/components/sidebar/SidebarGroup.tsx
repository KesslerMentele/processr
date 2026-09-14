import { useState, type FC, type PropsWithChildren, type MouseEvent } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";

interface SidebarRecipeGroupProps extends PropsWithChildren{
  title: string;
  onContextMenu?: (e: MouseEvent) => void;
  startCollapsed?: boolean;
}

const SidebarGroup: FC<SidebarRecipeGroupProps> = ({ title, onContextMenu, startCollapsed, children }) => {
  const [collapsed, setCollapsed] = useState(startCollapsed ?? false);

  const toggleCollapsed = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  return (
    <div className="sidebar-group">
      <button className="sidebar-group-header" onClick={toggleCollapsed} onContextMenu={(e) => {
        if (onContextMenu) onContextMenu(e);
      }}>
        {collapsed ? <LuChevronRight/> : <LuChevronDown/>}
        {title}
      </button>
      {!collapsed && children}
    </div>
  );
};

export default SidebarGroup;
