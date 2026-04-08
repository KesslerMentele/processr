
import NodePicker from "./NodePicker.tsx";
import RecipePicker from "./RecipePicker.tsx";
import DevTools from "./DevTools.tsx";
import type { FC } from "react";


const Sidebar: FC = () => {
  return (
    <div className="sidebar">
      <NodePicker/>
      <hr/>
      <RecipePicker/>
      <hr/>
      <DevTools/>
    </div>
  );
};

export default Sidebar;
