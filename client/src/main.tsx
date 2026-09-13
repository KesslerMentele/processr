import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './theme.css';
import './index.css';
import App from "./components/App.tsx";
import { DevSupport } from "@react-buddy/ide-toolbox";
import { ComponentPreviews, useInitial } from "./dev";


const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Root element #root not found in document');

createRoot(rootElement).render(
  <StrictMode>
    <DevSupport ComponentPreviews={ComponentPreviews}
                useInitialHook={useInitial}
    >
      <App/>
    </DevSupport>
  </StrictMode>,
);
