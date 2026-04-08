import { DraggableNodeTemplate } from "../NodeTemplate.tsx";
import { useProcessrStore } from "../../state/store.ts";


const NodePicker =  () => {
  const packIndex = useProcessrStore.use.packIndex();

    return (
      <div className="sidebar-nodetemplates">
        <h1>Nodes</h1>
        {packIndex.pack.nodeTemplates.map(template => (
          <DraggableNodeTemplate key={template.id} template={template}/>
        ))}
      </div>
    );
};


export default NodePicker;