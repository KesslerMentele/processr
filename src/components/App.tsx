import {type FC, useRef, useState} from 'react';
import {ReactFlowProvider} from "@xyflow/react";
import Canvas from "./Canvas.tsx";
import type {ProcessrNodeId} from "../models";
import Sidebar from "./Sidebar.tsx";
import {GraphProvider} from "../state/GraphContext.tsx";
import type {AddNodeFunc} from "../models/nodes.ts";

const App: FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<ProcessrNodeId | null>(null)
  const addNodeAtCenterRef = useRef<AddNodeFunc | null>(null)
  const onAddNode:AddNodeFunc = (template) => {
    addNodeAtCenterRef.current?.(template)
  }

  return (
    <div className="app-root">
      <GraphProvider>
        <ReactFlowProvider>
          <div className='app-layout'>
            <Sidebar selectedNodeId={selectedNodeId} onAddNode={onAddNode} />
            <Canvas onNodeSelect={setSelectedNodeId} onAddNodeReady={ (fn) => {
              // eslint-disable-next-line
              addNodeAtCenterRef.current = fn
            }}/>
          </div>
        </ReactFlowProvider>
      </GraphProvider>
    </div>
  )
}

export default App;