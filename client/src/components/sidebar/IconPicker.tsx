import { useRef, useState, type ChangeEvent, type FC } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import { LuImages, LuX } from "react-icons/lu";
import { listIcons, uploadIcon, type IconSummary } from "../../features/icons/icons-api.ts";

interface IconPickerProps {
  icon: string;
  onIconChange: (icon: string) => void;
  onRemove?: () => void;
}

const IconPicker: FC<IconPickerProps> = ({ icon, onIconChange, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIcons, setGalleryIcons] = useState<IconSummary[] | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const readFileAsDataUrl = (file: File): Promise<string> => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      // eslint-disable-next-line functional/immutable-data
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to read file"));
      };
      // eslint-disable-next-line functional/immutable-data
      reader.onerror = () => { reject(new Error("Failed to read file")); };
      reader.readAsDataURL(file);
    })
  );

  const handleIconFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    void readFileAsDataUrl(file)
      .then((dataUrl) => uploadIcon(dataUrl, file.name))
      .then((uploaded) => {
        onIconChange(uploaded.url);
        setGalleryIcons((prev) => (prev ? [uploaded, ...prev.filter((i) => i.id !== uploaded.id)] : prev));
      })
      .catch(() => { setUploadError("Upload failed"); })
      .finally(() => { setUploading(false); });
  };

  const toggleGallery = () => {
    const opening = !galleryOpen;
    setGalleryOpen(opening);
    if (opening && galleryIcons === null) {
      setGalleryError(null);
      void listIcons()
        .then(setGalleryIcons)
        .catch(() => { setGalleryError("Couldn't load icons"); });
    }
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

  const renderGallery = () => {
    if (!galleryOpen) return null;
    return (
      <div className="sidebar-icon-gallery">
        {galleryError && <div className="sidebar-icon-gallery-error">{galleryError}</div>}
        {galleryIcons === null && !galleryError && <div className="sidebar-icon-gallery-status">Loading…</div>}
        {galleryIcons?.length === 0 && <div className="sidebar-icon-gallery-status">No icons yet</div>}
        {galleryIcons && galleryIcons.length > 0 && (
          <div className="sidebar-icon-gallery-grid">
            {galleryIcons.map((existing) => (
              <button
                key={existing.id}
                type="button"
                className="sidebar-icon-gallery-item"
                title={existing.label ?? undefined}
                onClick={() => {
                  onIconChange(existing.url);
                  setGalleryOpen(false);
                }}
              >
                <img src={existing.url} alt="" />
              </button>
            ))}
          </div>
        )}
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
        disabled={uploading}
        title="Upload icon image"
      >
        <FaCirclePlus/>
      </button>
      <button
        type="button"
        className={`sidebar-icon-picker-btn ${galleryOpen ? "active" : ""}`}
        onClick={toggleGallery}
        title="Choose an existing icon"
      >
        <LuImages/>
      </button>
      {uploadError && <span className="sidebar-icon-gallery-error">{uploadError}</span>}
      <input
        ref={fileInputRef}
        className="sidebar-file-input-hidden"
        type="file"
        accept="image/*"
        onChange={handleIconFileChange}
      />
      {renderGallery()}
    </>
  );
};

export default IconPicker;
