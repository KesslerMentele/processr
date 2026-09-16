import { useRef, type ChangeEvent, type FC } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { LuX } from "react-icons/lu";

interface IconPickerProps {
  icon: string;
  onIconChange: (dataUrl: string) => void;
  onRemove?: () => void;
}

const IconPicker: FC<IconPickerProps> = ({ icon, onIconChange, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    // eslint-disable-next-line functional/immutable-data
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onIconChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderPreview = () => {
    if (icon === "") return null;
    if (!onRemove) return <img src={icon} alt="" className="sidebar-form-icon-preview" />;
    return (
      <div className="sidebar-form-icon-preview-wrapper">
        <img src={icon} alt="" className="sidebar-form-icon-preview" />
        <button
          type="button"
          className="sidebar-icon-btn sidebar-form-icon-remove-btn"
          onClick={onRemove}
          title="Remove icon"
        >
          <LuX/>
        </button>
      </div>
    );
  };

  return (
    <>
      {renderPreview()}
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
    </>
  );
};

export default IconPicker;
