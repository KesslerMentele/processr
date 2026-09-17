import { useState, type FC, type SubmitEvent } from "react";
import { useProcessrStore } from "../../../state/store.ts";
import { addItem, updateItem } from "../../../features/atlas-editor/atlas-mutations.ts";
import { ItemForm, type CategoryId, type ItemId } from "../../../models";
import SidebarFormGroup from "../SidebarFormGroup.tsx";
import IconPicker from "../IconPicker.tsx";
import type { AddItemInput, FormMode } from "../../../features/atlas-editor/atlas-types.ts";
import { getColorSync } from "colorthief";
// import { logger } from "../../utils/logger.ts";


interface AddItemFormProps {
  onClose: () => void;
  formMode: FormMode<ItemId, AddItemInput>;
}

const AddItemForm: FC<AddItemFormProps> = ({ onClose, formMode }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const loadAtlas = useProcessrStore.use.loadAtlas();
  const initialValues = formMode.initialValues;

  const [name, setName] = useState(initialValues?.name ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? "");
  const [color, setColor] = useState(initialValues?.color ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [categoryId, setCategoryId] = useState<CategoryId | "">(initialValues?.categoryId ?? "");
  const [form, setForm] = useState<ItemForm | "">(initialValues?.form ?? "");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (name.trim() === "") return;

    const input: AddItemInput = {
      name: name.trim(),
      ...(icon.trim() !== "" && { icon: icon.trim() }),
      ...(color.trim() !== "" && { color: color.trim() }),
      ...(description.trim() !== "" && { description: description.trim() }),
      ...(categoryId !== "" && { categoryId }),
      ...(form !== "" && { form }),
    };
    const newAtlas = formMode.mode === "edit"
      ? updateItem(atlasIndex.atlas, formMode.id, input)
      : addItem(atlasIndex.atlas, input);
    loadAtlas(newAtlas);
    onClose();
  };

  const handleIconChange = (iconUrl: string) => {
    setIcon(iconUrl);
    const image = new Image();
    // eslint-disable-next-line functional/immutable-data
    image.crossOrigin = "anonymous";
    // eslint-disable-next-line functional/immutable-data
    image.src = iconUrl;
    image.addEventListener("load", () => {
      const color = getColorSync(image);
      if (color) {
        setColor(color.toString());
      }
    });
  };

  const renderCategoryOptions = () => (
    <>
      <option value="">No category</option>
      {[...atlasIndex.categoriesById.values()].map((category) => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </>
  );

  const renderFormOptions = () => (
    <>
      <option value="">Unspecified form</option>
      {Object.values(ItemForm).map((value) => (
        <option key={value} value={value}>{value}</option>
      ))}
    </>
  );

  return (
    <SidebarFormGroup title={formMode.mode === "edit" ? "Edit Item" : "New Item"} onSubmit={handleSubmit}>
      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        autoFocus
      />
      <div className="sidebar-form-icon-row">
        <IconPicker icon={icon} onIconChange={handleIconChange} />
        <input
          className="sidebar-form-input"
          type="text"
          placeholder="Item Color"
          value={color}
          onChange={(e) => { setColor(e.target.value); }}
        />
      </div>

      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => { setDescription(e.target.value); }}
      />
      <select
        className="sidebar-form-input"
        value={categoryId}
        onChange={(e) => { setCategoryId(e.target.value as CategoryId | ""); }}
      >
        {renderCategoryOptions()}
      </select>
      <select
        className="sidebar-form-input"
        value={form}
        onChange={(e) => { setForm(e.target.value as ItemForm | ""); }}
      >
        {renderFormOptions()}
      </select>
      <div className="sidebar-form-actions">
        <button type="submit" className="sidebar-btn">{formMode.mode === "edit" ? "Save" : "Add"}</button>
        <button type="button" className="sidebar-btn" onClick={onClose}>Cancel</button>
      </div>
    </SidebarFormGroup>
  );
};

export default AddItemForm;
