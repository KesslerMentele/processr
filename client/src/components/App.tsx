import { type FC, useEffect } from 'react';
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./canvas/Canvas.tsx";
import Sidebar from "./sidebar/Sidebar.tsx";
import { saveProcessrGraph } from "../utils/persistence.ts";
import { useProcessrStore } from "../state/store.ts";
import { defaultShortcuts, KeyHubProvider } from "react-keyhub";


const myShortcuts = { ...defaultShortcuts };

const App: FC = () => {

  const graph = useProcessrStore.use.graph();
  const lightTheme = useProcessrStore.use.lightTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      saveProcessrGraph(graph);
    }, 100);
    return () => { clearTimeout(timer); };
  }, [graph]);

  useEffect(() => {
    if (lightTheme) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [lightTheme]);


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