import type { FC, PropsWithChildren, SubmitEvent } from "react";

interface SidebarFormGroupProps extends PropsWithChildren {
  title: string;
  onSubmit: (e:SubmitEvent) => void;
}

const SidebarFormGroup: FC<SidebarFormGroupProps> = ({ title, onSubmit, children }) => (
  <div className="sidebar-group" onSubmit={onSubmit}>
    <div className="sidebar-group-header">{title}</div>
    <form className="sidebar-add-form" >
      {children}
    </form>
  </div>
);

export default SidebarFormGroup;
