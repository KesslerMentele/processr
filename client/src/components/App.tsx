import { type FC, useEffect } from 'react';
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./canvas/Canvas.tsx";
import SidebarContainer from "./sidebar/SidebarContainer.tsx";
import { saveProcessrGraph } from "../utils/persistence.ts";
import { useProcessrStore } from "../state/store.ts";
import { defaultShortcuts, KeyHubProvider } from "react-keyhub";
import ContextMenu from "./contextMenu/ContextMenu.tsx";
import { useContextMenu } from "../hooks/useContextMenu.ts";
import { useModal } from "../hooks/useModal.ts";
import ModalContainer from "./modal/ModalContainer.tsx";


const myShortcuts = { ...defaultShortcuts };

const App: FC = () => {

  const graph = useProcessrStore.use.graph();
  const lightTheme = useProcessrStore.use.lightTheme();
  const { isContextMenuOpen, toggleContextMenu } = useContextMenu();
  const { isModalOpen } = useModal();


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
            <div className='app-layout'
                 onClick={() => {
                   if (isContextMenuOpen)  toggleContextMenu(null);
                 }}
            >
              <SidebarContainer />
              <Canvas />
              {isContextMenuOpen && <ContextMenu />}
              {isModalOpen && <ModalContainer />}
            </div>
        </KeyHubProvider>
      </ReactFlowProvider>
    </div>
  );
};

export default App;