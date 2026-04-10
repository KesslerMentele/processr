
import { clearAtlas, clearProcessrGraph } from "../../utils/persistence.ts";
import { useProcessrStore } from "../../state/store.ts";


const DevTools = () => {
  const loadGraph = useProcessrStore.use.loadGraph();
  const packIndex = useProcessrStore.use.packIndex();

  const handleClearGraph = () => {
    clearProcessrGraph();
    loadGraph({ atlasIndex: packIndex });
  };
  const handleClearGamepack = () => {
    clearAtlas();
    handleClearGraph();
  };

  return (
    <div className="sidebar-dev-tools">
      <button className="sidebar-dev-btn" onClick={handleClearGraph}>Clear Graph</button>
      <button className="sidebar-dev-btn sidebar-dev-btn-danger" onClick={handleClearGamepack}>Clear Saved Atlas</button>
    </div>
  );
};

export default DevTools;