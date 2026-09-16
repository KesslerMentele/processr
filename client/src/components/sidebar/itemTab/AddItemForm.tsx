import { useRef, useState, type ChangeEvent, type FC, type SubmitEvent } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { useProcessrStore } from "../../../state/store.ts";
import { addItem } from "../../../features/atlas-editor/atlas-mutations.ts";
import { ItemForm, type CategoryId } from "../../../models";
import SidebarFormGroup from "../SidebarFormGroup.tsx";
import { getColorSync } from "colorthief";
// import { logger } from "../../utils/logger.ts";


interface AddItemFormProps {
  onClose: () => void;
}

const AddItemForm: FC<AddItemFormProps> = ({ onClose }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const loadAtlas = useProcessrStore.use.loadAtlas();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | "">("");
  const [form, setForm] = useState<ItemForm | "">("");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (name.trim() === "") return;

    const newAtlas = addItem(atlasIndex.atlas, {
      name: name.trim(),
      ...(icon.trim() !== "" && { icon: icon.trim() }),
      ...(color.trim() !== "" && { color: color.trim() }),
      ...(description.trim() !== "" && { description: description.trim() }),
      ...(categoryId !== "" && { categoryId }),
      ...(form !== "" && { form }),
    });
    loadAtlas(newAtlas);
    onClose();
  };

  const handleIconFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    // eslint-disable-next-line functional/immutable-data
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setIcon(reader.result);
        const image = new Image();
        // eslint-disable-next-line functional/immutable-data
        image.src = reader.result;
        const color = getColorSync(image);
        if (color) {
          setColor(color.toString());
        }
      }
    };
    reader.readAsDataURL(file);
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
    <SidebarFormGroup title="New Item" onSubmit={handleSubmit}>
      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        autoFocus
      />
      <div className="sidebar-form-icon-row">
        {icon !== "" &&
            <img src={icon} alt="" className="sidebar-form-icon-preview" />
        }
        <button
          type="button"
          className="sidebar-icon-picker-btn"
          onClick={() => { fileInputRef.current?.click(); }}
          title="Choose icon image"
        >
          <FaCirclePlus/>
        </button>
        <input
          ref={fileInputRef}
          className="sidebar-file-input-hidden"
          type="file"
          accept="image/*"
          onChange={handleIconFileChange}
        />
        <input
          className="sidebar-form-input"
          type="text"
          placeholder="Color"
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
        <button type="submit" className="sidebar-btn">Add</button>
        <button type="button" className="sidebar-btn" onClick={onClose}>Cancel</button>
      </div>
    </SidebarFormGroup>
  );
};

export default AddItemForm;
