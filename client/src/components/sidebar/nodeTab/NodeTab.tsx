import { useState, type MouseEvent } from "react";
import NodeList from "./NodeList.tsx";
import AddNodeForm from "./AddNodeForm.tsx";
import { useSidebarState } from "../../../hooks/useSidebarState.ts";
import RecipeSelector from "./RecipeSelector.tsx";
import { useContextMenu } from "../../../hooks/useContextMenu.ts";
import { useProcessrStore } from "../../../state/store.ts";
import { nodeTemplateToInput } from "../../../features/atlas-editor/atlas-mutations.ts";
import type { NodeTemplateId } from "../../../models";

type NodeFormState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; id: NodeTemplateId };

const NodeTab = () => {
  const { selectedNodeIds } = useSidebarState();
  const { toggleContextMenu } = useContextMenu();
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const [formState, setFormState] = useState<NodeFormState>({ mode: "closed" });

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    toggleContextMenu({
      x: e.clientX,
      y: e.clientY,
      data: { target: "Sidebar" },
      items: [
        { label: `Create New Node`, onClick: () => { setFormState({ mode: "add" }); } }
      ],
    });
  };

  const editingTemplate = formState.mode === "edit" ? atlasIndex.nodeTemplatesById.get(formState.id) : undefined;

  return (
    <>
      <div className="sidebar-list-container" onContextMenu={onContextMenu}>
        <h1>Nodes</h1>
        {formState.mode !== "closed" &&
          <AddNodeForm
            onClose={() => { setFormState({ mode: "closed" }); }}
            formMode={
              formState.mode === "edit" && editingTemplate
                ? { mode: "edit", id: formState.id, initialValues: nodeTemplateToInput(editingTemplate) }
                : { mode: "add" }
            }
          />
        }
        <NodeList onEdit={(id) => { setFormState({ mode: "edit", id }); }}/>
      </div>
      {selectedNodeIds.length > 0 ? <RecipeSelector/> : null}
    </>
  );
};

export default NodeTab;