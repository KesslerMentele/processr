import {type FC, useEffect} from 'react';
import {ReactFlowProvider} from "@xyflow/react";
import Canvas from "./Canvas.tsx";
import Sidebar from "./Sidebar.tsx";
import {saveDocument} from "../utils/persistence.ts";
import {useProcessrStore} from "../state/store.ts";



const App: FC = () => {


  const graph = useProcessrStore.use.graph()

  useEffect(() => {

    const timer = setTimeout(() => {
      saveDocument(graph)
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [graph]);


  return (
    <div className="app-root">
      <ReactFlowProvider>
          <div className='app-layout'>
            <Sidebar />
            <Canvas />
          </div>
        </ReactFlowProvider>
    </div>
  )
}

export default App;