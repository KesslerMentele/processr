import { useState, type FC, type SubmitEvent } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { LuX } from "react-icons/lu";
import { useProcessrStore } from "../../../state/store.ts";
import { addNodeTemplate, updateNodeTemplate } from "../../../features/atlas-editor/atlas-mutations.ts";
import { PortDirection, type CategoryId, type NodeTemplateId } from "../../../models";
import SidebarFormGroup from "../SidebarFormGroup.tsx";
import IconPicker from "../IconPicker.tsx";
import type { AddNodeTemplateInput, AddNodeTemplatePortInput, FormMode } from "../../../features/atlas-editor/atlas-types.ts";

interface AddNodeFormProps {
  onClose: () => void;
  formMode: FormMode<NodeTemplateId, AddNodeTemplateInput>;
}

interface PortRowProps {
  port: AddNodeTemplatePortInput;
  onRemove: () => void;
}

const PortRow: FC<PortRowProps> = ({ port, onRemove }) => (
  <div className="sidebar-resource-stack-row">
    <span className="sidebar-resource-stack-name">{port.name} ({port.direction})</span>
    <button type="button" className="sidebar-icon-btn" onClick={onRemove} title="Remove">
      <LuX/>
    </button>
  </div>
);

const AddNodeForm: FC<AddNodeFormProps> = ({ onClose, formMode }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const loadAtlas = useProcessrStore.use.loadAtlas();
  const initialValues = formMode.initialValues;

  const [name, setName] = useState(initialValues?.name ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? "");
  const [categoryId, setCategoryId] = useState<CategoryId | "">(initialValues?.categoryId ?? "");
  const [speedMultiplier, setSpeedMultiplier] = useState(String(initialValues?.speedMultiplier ?? 1));
  const [powerConsumption, setPowerConsumption] = useState(initialValues?.powerConsumption === undefined ? "" : String(initialValues.powerConsumption));
  const [moduleSlots, setModuleSlots] = useState(initialValues?.moduleSlots === undefined ? "" : String(initialValues.moduleSlots));
  const [tags, setTags] = useState((initialValues?.tags ?? []).join(", "));
  const [ports, setPorts] = useState(initialValues?.ports ?? []);

  const [newPortName, setNewPortName] = useState("");
  const [newPortDirection, setNewPortDirection] = useState<PortDirection>(PortDirection.Input);

  const handleAddPort = () => {
    if (newPortName.trim() === "") return;
    setPorts((prev) => [...prev, { name: newPortName.trim(), direction: newPortDirection }]);
    setNewPortName("");
  };

  const handleRemovePort = (index: number) => {
    setPorts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (name.trim() === "") return;

    const input: AddNodeTemplateInput = {
      name: name.trim(),
      ...(categoryId !== "" && { categoryId }),
      ...(initialValues?.color !== undefined && { color: initialValues.color }),
      ...(icon.trim() !== "" && { icon: icon.trim() }),
      speedMultiplier: Number(speedMultiplier) || 1,
      ...(powerConsumption.trim() !== "" && { powerConsumption: Number(powerConsumption) || 0 }),
      ...(moduleSlots.trim() !== "" && { moduleSlots: Number(moduleSlots) || 0 }),
      ...(ports.length > 0 && { ports }),
      tags: tags.split(",").map((tag) => tag.trim()).filter((tag) => tag !== ""),
    };
    const newAtlas = formMode.mode === "edit"
      ? updateNodeTemplate(atlasIndex.atlas, formMode.id, input)
      : addNodeTemplate(atlasIndex.atlas, input);
    loadAtlas(newAtlas);
    onClose();
  };

  const renderCategoryOptions = () => (
    <>
      <option value="">No category</option>
      {[...atlasIndex.categoriesById.values()].map((category) => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </>
  );

  return (
    <SidebarFormGroup title={formMode.mode === "edit" ? "Edit Node" : "New Node"} onSubmit={handleSubmit}>
      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        autoFocus
      />
      <div className="sidebar-form-icon-row">
        <IconPicker icon={icon} onIconChange={setIcon} onRemove={() => { setIcon(""); }} />
      </div>
      <select
        className="sidebar-form-input"
        value={categoryId}
        onChange={(e) => { setCategoryId(e.target.value as CategoryId | ""); }}
      >
        {renderCategoryOptions()}
      </select>
      <div className="sidebar-form-icon-row">
        <input
          className="sidebar-form-input"
          type="number"
          min={0}
          step={0.01}
          placeholder="Speed Multiplier"
          value={speedMultiplier}
          onChange={(e) => { setSpeedMultiplier(e.target.value); }}
        />
        <input
          className="sidebar-form-input"
          type="number"
          min={0}
          placeholder="Power Consumption"
          value={powerConsumption}
          onChange={(e) => { setPowerConsumption(e.target.value); }}
        />
        <input
          className="sidebar-form-input"
          type="number"
          min={0}
          placeholder="Module Slots"
          value={moduleSlots}
          onChange={(e) => { setModuleSlots(e.target.value); }}
        />
      </div>
      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => { setTags(e.target.value); }}
      />
      {ports.map((port, index) => (
        <PortRow key={`${port.name}-${String(index)}`} port={port} onRemove={() => { handleRemovePort(index); }} />
      ))}
      <div className="sidebar-form-icon-row">
        <input
          className="sidebar-form-input"
          type="text"
          placeholder="Port name"
          value={newPortName}
          onChange={(e) => { setNewPortName(e.target.value); }}
        />
        <select
          className="sidebar-form-input"
          value={newPortDirection}
          onChange={(e) => { setNewPortDirection(e.target.value as PortDirection); }}
        >
          <option value={PortDirection.Input}>Input</option>
          <option value={PortDirection.Output}>Output</option>
        </select>
        <button type="button" className="sidebar-btn sidebar-resource-add-btn" onClick={handleAddPort}>
          <FaCirclePlus/> Port
        </button>
      </div>
      <div className="sidebar-form-actions">
        <button type="submit" className="sidebar-btn">{formMode.mode === "edit" ? "Save" : "Add"}</button>
        <button type="button" className="sidebar-btn" onClick={onClose}>Cancel</button>
      </div>
    </SidebarFormGroup>
  );
};

export default AddNodeForm;
