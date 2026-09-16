import type { FC } from "react";
import { LuX } from "react-icons/lu";

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

export default ResourceStackRow;