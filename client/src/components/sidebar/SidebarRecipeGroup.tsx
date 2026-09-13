import { useState, type FC, type ReactNode } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";

interface SidebarRecipeGroupProps {
  title: string;
  children: ReactNode;
}

const SidebarRecipeGroup: FC<SidebarRecipeGroupProps> = ({ title, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="sidebar-recipe-group">
      <button className="sidebar-recipe-group-header" onClick={toggleCollapsed}>
        {collapsed ? <LuChevronRight/> : <LuChevronDown/>}
        {title}
      </button>
      {!collapsed && children}
    </div>
  );
};

export default SidebarRecipeGroup;
