import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import type { FC } from "react";
interface NumberStepperInputProps {
  placeholder: string;
  value: number;
  step: number;
  onChange: (d:number) => void;
  onIncrement: (d:number) => void;
  onDecrement: (d:number) => void;
}


const NumberStepperInput: FC<NumberStepperInputProps> = ({ placeholder, value, onChange, onDecrement, onIncrement, step }) => {
  return (
    <div className="sidebar-number-stepper">
      <input
        className="sidebar-form-input sidebar-number-stepper-input"
        type="number"
        min={0}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(Number(e.target.value)); }}
      />
      <div className="sidebar-number-stepper-buttons">
        <button
          type="button"
          className="sidebar-number-stepper-btn"
          onClick={() => { onIncrement(1); }}
          title="Increment"
        >
          <LuChevronUp/>
        </button>
        <button
          type="button"
          className="sidebar-number-stepper-btn"
          onClick={() => { onDecrement(-1); }}
          title="Decrement"
        >
          <LuChevronDown/>
        </button>
      </div>
    </div>
  );
};

export default NumberStepperInput;