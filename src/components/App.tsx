import {type FC, useState} from 'react';
import {ReactFlowProvider} from "@xyflow/react";
import Canvas from "./Canvas.tsx";
import type {ProcessorNodeId} from "../models";
import Sidebar from "./Sidebar.tsx";
import {GraphProvider} from "../state/GraphContext.tsx";

const App: FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<ProcessorNodeId | null>(null)

  return (
    <div className="app-root">
      <GraphProvider>
        <ReactFlowProvider>
          <div className='app-layout'>
            <Sidebar selectedNodeId={selectedNodeId}/>
            <Canvas onNodeSelect={setSelectedNodeId}/>
          </div>
        </ReactFlowProvider>
      </GraphProvider>
    </div>
  )
}

export default App;