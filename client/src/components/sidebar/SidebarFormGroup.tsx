import type { FC, ReactNode } from "react";

interface SidebarFormGroupProps {
  title: string;
  children: ReactNode;
}

const SidebarFormGroup: FC<SidebarFormGroupProps> = ({ title, children }) => (
  <div className="sidebar-recipe-group">
    <div className="sidebar-recipe-group-header">{title}</div>
    {children}
  </div>
);

export default SidebarFormGroup;
