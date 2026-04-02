import { type FC, useEffect } from 'react';
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./Canvas.tsx";
import Sidebar from "./Sidebar.tsx";
import { saveProcessrGraph } from "../utils/persistence.ts";
import { useProcessrStore } from "../state/store.ts";
import { defaultShortcuts, KeyHubProvider } from "react-keyhub";


const myShortcuts = { ...defaultShortcuts };

const App: FC = () => {


  const graph = useProcessrStore.use.graph();

  useEffect(() => {

    const timer = setTimeout(() => {
      saveProcessrGraph(graph);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [graph]);


  return (
    <div className="app-root">
      <ReactFlowProvider>
        <KeyHubProvider shortcuts={myShortcuts}>
            <div className='app-layout'>
              <Sidebar />
              <Canvas />
            </div>
        </KeyHubProvider>
      </ReactFlowProvider>
    </div>
  );
};

export default App;