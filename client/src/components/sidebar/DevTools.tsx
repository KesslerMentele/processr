
import { clearAtlas, clearProcessrGraph } from "../../utils/persistence.ts";
import { useProcessrStore } from "../../state/store.ts";


const DevTools = () => {
  const loadGraph = useProcessrStore.use.loadGraph();
  const atlasIndex = useProcessrStore.use.atlasIndex();

  const handleClearGraph = () => {
    clearProcessrGraph();
    loadGraph({ atlasIndex: atlasIndex });
  };
  const handleClearAtlas = () => {
    clearAtlas();
    handleClearGraph();
  };

  return (
    <div className="sidebar-dev-tools">
      <button className="sidebar-dev-btn" onClick={handleClearGraph}>Clear Graph</button>
      <button className="sidebar-dev-btn sidebar-dev-btn-danger" onClick={handleClearAtlas}>Clear Saved Atlas</button>
    </div>
  );
};

export default DevTools;