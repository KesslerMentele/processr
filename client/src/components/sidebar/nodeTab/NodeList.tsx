import type { FC } from "react";
import type { NodeTemplateId } from "../../../models";
import { DraggableNodeTemplate } from "./NodeTemplate.tsx";
import { useProcessrStore } from "../../../state/store.ts";

interface NodeListProps {
  onEdit: (id: NodeTemplateId) => void;
}

const NodeList: FC<NodeListProps> = ({ onEdit }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();

  return (
    <>
      {atlasIndex.atlas.nodeTemplates.map(template => (
        <DraggableNodeTemplate key={template.id} template={template} onEdit={() => { onEdit(template.id); }}/>
      ))}
    </>
  );
};


export default NodeList;