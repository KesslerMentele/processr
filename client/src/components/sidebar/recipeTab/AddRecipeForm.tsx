import { useMemo, useRef, useState, type ChangeEvent, type FC, type SubmitEvent } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { LuX } from "react-icons/lu";
import { useProcessrStore } from "../../../state/store.ts";
import { addRecipe } from "../../../features/atlas-editor/atlas-mutations.ts";
import { TimeUnit, type CategoryId, type ItemId, type NodeTemplateId, type RecipeItemStack } from "../../../models";
import SidebarFormGroup from "../SidebarFormGroup.tsx";
import SidebarGroup from "../SidebarGroup.tsx";
import type { AddRecipeInput } from "../../../features/atlas-editor/atlas-types.ts";


interface AddRecipeFormProps {
  onClose: () => void;
}

type ResourceSetter = (updater: (prev: readonly RecipeItemStack[]) => readonly RecipeItemStack[]) => void;
type MadeInMode = "name" | "tag";

interface ResourceStackRowProps {
  itemName: string;
  amount: number;
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
}

const ResourceStackRow: FC<ResourceStackRowProps> = ({ itemName, amount, onAmountChange, onRemove }) => (
  <div className="sidebar-resource-stack-row">
    <span className="sidebar-resource-stack-name">{itemName}</span>
    <input
      className="sidebar-form-input sidebar-resource-amount-input"
      type="number"
      min={0}
      value={amount}
      onChange={(e) => { onAmountChange(Number(e.target.value)); }}
    />
    <button type="button" className="sidebar-icon-btn" onClick={onRemove} title="Remove">
      <LuX/>
    </button>
  </div>
);

const AddRecipeForm: FC<AddRecipeFormProps> = ({ onClose }) => {
  const atlasIndex = useProcessrStore.use.atlasIndex();
  const loadAtlas = useProcessrStore.use.loadAtlas();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | "">("");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState<TimeUnit>(TimeUnit.Second);

  const [search, setSearch] = useState("");
  const [inputs, setInputs] = useState<readonly RecipeItemStack[]>([]);
  const [outputs, setOutputs] = useState<readonly RecipeItemStack[]>([]);

  const [madeInMode, setMadeInMode] = useState<MadeInMode>("name");
  const [compatibleNodeTypes, setCompatibleNodeTypes] = useState<readonly NodeTemplateId[]>([]);
  const [compatibleNodeTags, setCompatibleNodeTags] = useState<readonly string[]>([]);

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
      }
    };
    reader.readAsDataURL(file);
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
    <SidebarFormGroup title="New Recipe" onSubmit={handleSubmit}>
      <input
        className="sidebar-form-input"
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        autoFocus
      />
      <SidebarGroup title="Resources" startCollapsed={true}>
        <input
          className="sidebar-form-input"
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
        />
        {searchResults.length > 0 &&
          <div className="sidebar-resource-search-results">
            {searchResults.map((item) => (
              <div key={item.id} className="sidebar-resource-search-row">
                <span className="sidebar-resource-search-name">{item.name}</span>
                <button
                  type="button"
                  className="sidebar-btn sidebar-resource-add-btn"
                  onClick={() => { addToStack(setInputs as ResourceSetter, item.id); }}
                >
                  <FaCirclePlus/> In
                </button>
                <button
                  type="button"
                  className="sidebar-btn sidebar-resource-add-btn"
                  onClick={() => { addToStack(setOutputs as ResourceSetter, item.id); }}
                >
                  <FaCirclePlus/> Out
                </button>
              </div>
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
            step={0.0001}
            placeholder="Duration"
            value={duration}
            onChange={(e) => { setDuration(e.target.value); }}
          />
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
        <button type="submit" className="sidebar-btn">Add</button>
        <button type="button" className="sidebar-btn" onClick={onClose}>Cancel</button>
      </div>
    </SidebarFormGroup>
  );
};

export default AddRecipeForm;
