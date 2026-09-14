import { DraggableNodeTemplate } from "./NodeTemplate.tsx";
import { useProcessrStore } from "../../../state/store.ts";


const NodeList =  () => {
  const atlasIndex = useProcessrStore.use.atlasIndex();

  return (
    <>
      {atlasIndex.atlas.nodeTemplates.map(template => (
        <DraggableNodeTemplate key={template.id} template={template}/>
      ))}
    </>
  );
};


export default NodeList;