import { useMemo, useState, type FC, type SubmitEvent } from "react";
import { LuChevronDown, LuChevronUp, LuX } from "react-icons/lu";
import { useProcessrStore } from "../../../state/store.ts";
import { addRecipe, updateRecipe } from "../../../features/atlas-editor/atlas-mutations.ts";
import {
  TimeUnit, type CategoryId, type ItemId, type NodeTemplateId, type RecipeId, type RecipeItemStack,
  type Atlas
} from "../../../models";
import SidebarFormGroup from "../SidebarFormGroup.tsx";
import SidebarGroup from "../SidebarGroup.tsx";
import IconPicker from "../IconPicker.tsx";
import type { AddRecipeInput, FormMode } from "../../../features/atlas-editor/atlas-types.ts";
import ResourceStackRow from "./ResourceStackRow.tsx";
import ResourceSearchRow from "./ResourceSearchRow.tsx";


interface AddRecipeFormProps {
  onClose: () => void;
  formMode: FormMode<RecipeId, AddRecipeInput>;
}

type ResourceSetter = (updater: (prev: readonly RecipeItemStack[]) => readonly RecipeItemStack[]) => void;
type MadeInMode = "name" | "tag";



const AddRecipeForm: FC<AddRecipeFormProps> = ({ onClose, formMode }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const loadAtlas = useProcessrStore.use.loadAtlas();
  const initialValues = formMode.initialValues;

  const [name, setName] = useState(initialValues?.name ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? "");
  const [categoryId, setCategoryId] = useState<CategoryId | "">(initialValues?.categoryId ?? "");
  const [duration, setDuration] = useState(initialValues?.duration === undefined ? "1" : String(initialValues.duration));
  const [durationUnit, setDurationUnit] = useState<TimeUnit>(initialValues?.durationUnit ?? TimeUnit.Second);

  const [search, setSearch] = useState("");
  const [inputs, setInputs] = useState(initialValues?.inputs ?? []);
  const [outputs, setOutputs] = useState(initialValues?.outputs ?? []);

  const [madeInMode, setMadeInMode] = useState<MadeInMode>("name");
  const [compatibleNodeTypes, setCompatibleNodeTypes] = useState(initialValues?.compatibleNodeTypes ?? []);
  const [compatibleNodeTags, setCompatibleNodeTags] = useState(initialValues?.compatibleNodeTags ?? []);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return [];
    return atlasIndex.atlas.items
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [atlasIndex.atlas.items, search]);

  const allTags = useMemo(() => (
    [...new Set(atlasIndex.atlas.nodeTemplates.flatMap((template) => template.tags))]
  ), [atlasIndex.atlas.nodeTemplates]);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (name.trim() === "") return;

    const newRecipe: AddRecipeInput = {
      name: name.trim(),
      duration: Number(duration) || 0,
      durationUnit,
      ...(categoryId !== "" && { categoryId }),
      ...(icon.trim() !== "" && { icon: icon.trim() }),
      inputs,
      outputs,
      compatibleNodeTypes,
      compatibleNodeTags,
    };
    const newAtlas: Atlas = formMode.mode === "edit"
      ? updateRecipe(atlasIndex.atlas, formMode.id, newRecipe)
      : addRecipe(atlasIndex.atlas, newRecipe);
    loadAtlas(newAtlas);
    onClose();
  };

  const addToStack = (setStack: ResourceSetter, itemId: ItemId) => {
    setStack((prev) => (
      prev.some((stack) => stack.itemId === itemId)
        ? prev
        : [...prev, { itemId, amount: 1 }]
    ));
  };

  const updateStackAmount = (setStack: ResourceSetter, itemId: ItemId, amount: number) => {
    setStack((prev) => prev.map((stack) => (stack.itemId === itemId ? { ...stack, amount } : stack)));
  };

  const removeFromStack = (setStack: ResourceSetter, itemId: ItemId) => {
    setStack((prev) => prev.filter((stack) => stack.itemId !== itemId));
  };

  const adjustDuration = (delta: number) => {
    setDuration((prev) => String(Math.max(0, (Number(prev) || 0) + delta)));
  };

  const renderStackColumn = (title: string, stacks: readonly RecipeItemStack[], setStack: ResourceSetter) => (
    <div className="sidebar-resource-column">
      <div className="sidebar-resource-column-header">{title}</div>
      {stacks.map((stack) => (
        <ResourceStackRow
          key={stack.itemId}
          itemName={atlasIndex.itemsById.get(stack.itemId)?.name ?? stack.itemId}
          amount={stack.amount}
          onAmountChange={(amount) => { updateStackAmount(setStack, stack.itemId, amount); }}
          onRemove={() => { removeFromStack(setStack, stack.itemId); }}
        />
      ))}
    </div>
  );

  const renderCategoryOptions = () => (
    <>
      <option value="">No category</option>
      {[...atlasIndex.categoriesById.values()].map((category) => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </>
  );

  return (
    <SidebarFormGroup title={formMode.mode === "edit" ? "Edit Recipe" : "New Recipe"} onSubmit={handleSubmit}>
      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        autoFocus
      />
      <SidebarGroup title="Resources" startCollapsed={true}>
        <div className="sidebar-search-input-wrapper">
          <input
            className="sidebar-form-input sidebar-search-input"
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
          />
          {search !== "" &&
            <button
              type="button"
              className="sidebar-icon-btn sidebar-search-clear-btn"
              onClick={() => { setSearch(""); }}
              title="Clear search"
            >
              <LuX/>
            </button>
          }
        </div>
        {searchResults.length > 0 &&
          <div className="sidebar-resource-search-results">
            {searchResults.map((item) => (
              <ResourceSearchRow
                key={item.id}
                item={item}
                onAddInput={() => { addToStack(setInputs as ResourceSetter, item.id); }}
                onAddOutput={() => { addToStack(setOutputs as ResourceSetter, item.id); }}
              />
            ))}
          </div>
        }
        <div className="sidebar-resource-columns">
          {renderStackColumn("Inputs", inputs, setInputs as ResourceSetter)}
          {renderStackColumn("Outputs", outputs, setOutputs as ResourceSetter)}
        </div>
      </SidebarGroup>

      <SidebarGroup title="Made In" startCollapsed={true}>
        <div className="sidebar-mode-toggle">
          <button
            type="button"
            className={`sidebar-btn sidebar-toggle-btn ${madeInMode === "name" ? "active" : ""}`}
            onClick={() => { setMadeInMode("name"); }}
          >
            By Machine
          </button>
          <button
            type="button"
            className={`sidebar-btn sidebar-toggle-btn ${madeInMode === "tag" ? "active" : ""}`}
            onClick={() => { setMadeInMode("tag"); }}
          >
            By Tag
          </button>
        </div>
        {madeInMode === "name"
          ? (
            <select
              className="sidebar-form-input sidebar-form-select-multiple"
              multiple
              value={compatibleNodeTypes}
              onChange={(e) => {
                setCompatibleNodeTypes(Array.from(e.target.selectedOptions, (option) => option.value as NodeTemplateId));
              }}
            >
              {atlasIndex.atlas.nodeTemplates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          )
          : (
            <select
              className="sidebar-form-input sidebar-form-select-multiple"
              multiple
              value={compatibleNodeTags as string[]}
              onChange={(e) => {
                setCompatibleNodeTags(Array.from(e.target.selectedOptions, (option) => option.value));
              }}
            >
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )
        }
      </SidebarGroup>

      <SidebarGroup title="Details" startCollapsed={true}>
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
          <div className="sidebar-number-stepper">
            <input
              className="sidebar-form-input sidebar-number-stepper-input"
              type="number"
              min={0}
              step={0.0001}
              placeholder="Duration"
              value={duration}
              onChange={(e) => { setDuration(e.target.value); }}
            />
            <div className="sidebar-number-stepper-buttons">
              <button
                type="button"
                className="sidebar-number-stepper-btn"
                onClick={() => { adjustDuration(1); }}
                title="Increment"
              >
                <LuChevronUp/>
              </button>
              <button
                type="button"
                className="sidebar-number-stepper-btn"
                onClick={() => { adjustDuration(-1); }}
                title="Decrement"
              >
                <LuChevronDown/>
              </button>
            </div>
          </div>
          <select
            className="sidebar-form-input"
            value={durationUnit}
            onChange={(e) => { setDurationUnit(e.target.value as TimeUnit); }}
          >
            {Object.values(TimeUnit).map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </SidebarGroup>

      <div className="sidebar-form-actions">
        <button type="submit" className="sidebar-btn">{formMode.mode === "edit" ? "Save" : "Add"}</button>
        <button type="button" className="sidebar-btn" onClick={onClose}>Cancel</button>
      </div>
    </SidebarFormGroup>
  );
};

export default AddRecipeForm;
