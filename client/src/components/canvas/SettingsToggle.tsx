import type { FC, ReactNode } from "react";


interface SettingsToggleProps {
  value: boolean;
  onChange: () => void;
  title: ReactNode;
}

const SettingsToggle: FC<SettingsToggleProps> = ({ value, onChange, title }) => {
  return (
    <label className="canvas-settings-panel-toggle">
      <input type="checkbox" checked={value} onChange={onChange} />
      {title}
    </label>
  );
};

export default SettingsToggle;