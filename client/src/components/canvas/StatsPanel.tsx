import type { FC } from "react";
import { Panel } from "@xyflow/react";


const StatsPanel: FC = () => {
  return (
    <Panel position={'top-left'} >
      <div className={'canvas-panel'}>
        input
        <br/>
        output
      </div>
    </Panel>
  );
};

export default StatsPanel;