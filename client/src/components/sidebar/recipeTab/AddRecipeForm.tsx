import { useRef, useState, type ChangeEvent, type FC, type SubmitEvent } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { useProcessrStore } from "../../../state/store.ts";
import {addItem, addRecipe} from "../../../features/atlas-editor/atlas-mutations.ts";
import {ItemForm, type CategoryId, type Recipe} from "../../../models";
import SidebarFormGroup from "../SidebarFormGroup.tsx";
import { getColorSync } from "colorthief";
import type {AddRecipeInput} from "../../../features/atlas-editor/atlas-types.ts";
import SidebarGroup from "../SidebarGroup.tsx";
// import { logger } from "../../utils/logger.ts";


interface AddItemFormProps {
  onClose: () => void;
}

const AddItemForm: FC<AddItemFormProps> = ({ onClose }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const loadAtlas = useProcessrStore.use.loadAtlas();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (name.trim() === "") return;
    const newRecipe:AddRecipeInput = {
      categoryId: undefined,
      compatibleNodeTags: [],
      compatibleNodeTypes: [],
      duration: 0,
      durationUnit: undefined,
      icon: "",
      inputs: [],
      name: "",
      outputs: []

    };
    const newAtlas = addRecipe(atlasIndex.atlas, newRecipe);
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
      <SidebarGroup title={"Resources"}>
        <div>Resources</div>
      </SidebarGroup>
      <SidebarGroup title={"Made In"}>
        <div>Made In</div>
      </SidebarGroup>
      <SidebarGroup title={"Details"}>
        <div>Details</div>
      </SidebarGroup>
      <div className="sidebar-form-actions">
        <button type="submit" className="sidebar-btn">Add</button>
        <button type="button" className="sidebar-btn" onClick={onClose}>Cancel</button>
      </div>
    </SidebarFormGroup>
  );
};

export default AddItemForm;
