import {
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuCircleHelp,
  LuDownload,
  LuUpload,
  LuX,
} from "react-icons/lu";
import { type ChangeEvent, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from 'react';
import { downloadAtlasAs, parseAtlasFile } from "../atlas-api.ts";
import type { Atlas } from "../../../models";
import { useAtlasEditorHeaderState } from "../hooks/useAtlasEditorHeaderState.ts";
import { saveAtlasEditorText } from "../../../utils/persistence.ts";
import { useProcessrStore } from "../../../state/store.ts";

interface AtlasEditorHeaderProps {
  getCurrentText: () => string;
  replaceAll: (text: string) => void;
}

const AtlasEditorHeader = ({ getCurrentText, replaceAll }: Readonly<AtlasEditorHeaderProps>) => {
  const atlas = useProcessrStore.use.atlasIndex().atlas;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posRef = useRef({ x: 0, y: 0 });

  const { packIndex, status, collapsed, errors, helpOpen, loadAtlas, togglePackEditor, setPosition, setStatus, setErrors, setHelpOpen, setCollapsed } = useAtlasEditorHeaderState();

  const handleHeaderMouseDown = (e: Readonly<ReactMouseEvent>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;

    const onMove = (ev: Readonly<globalThis.MouseEvent>) => {
      const newPos = { x: ev.clientX - startX, y: ev.clientY - startY };
      // eslint-disable-next-line functional/immutable-data
      posRef.current = newPos;
      setPosition(newPos);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const applyResult = (atlas: Atlas) => {
    loadAtlas(atlas);
    setErrors([]);
    setStatus('ok');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('parsing');
    const [result, text] = await Promise.all([parseAtlasFile(file), file.text()]);
    if (result.errors) {
      setErrors(result.errors);
      setStatus('error');
    } else {
      applyResult(result.pack);
      replaceAll(text);
    }
    // eslint-disable-next-line functional/immutable-data
    e.target.value = '';
  };

  const handleApplyPack = () => {
    applyResult(atlas);
    saveAtlasEditorText(getCurrentText());
    setStatus('applied');
  };

  const handleClose = () => {
    saveAtlasEditorText(getCurrentText());
    togglePackEditor();
  };

  const handleDownload = () => {
    const filename = `${packIndex.atlas.name.toLowerCase().replaceAll(' ', '-')}.prat`;
    downloadAtlasAs(getCurrentText(), filename);
  };


  const handleToggleHelp     = () => { setHelpOpen(!helpOpen); };
  const handleToggleCollapsed = () => { setCollapsed(!collapsed); };
  const handleFileChange     = (e: ChangeEvent<HTMLInputElement>) => { void handleFileUpload(e); };

  const getStatusLabel = () => {
    switch (status) {
      case "idle": return 'Ready';
      case "parsing": return 'Parsing…';
      case "ok": return 'Atlas is Valid';
      case "error": return `${errors.length.toString()} error${errors.length === 1 ? '' : 's'}`;
      case "applied": return 'Atlas applied';
    }
  };

  return (
    <div className="pack-editor-header" onMouseDown={handleHeaderMouseDown}>

      <span className="pack-editor-title">Atlas Editor</span>
      <span className={`pack-editor-status pack-editor-status-${status}`}>{getStatusLabel()}</span>

      <button className={`pack-editor-icon-btn${helpOpen ? ' pack-editor-icon-btn-active' : ''}`} title="Grammar reference" onClick={handleToggleHelp}>
        <LuCircleHelp />
      </button>

      <button className="pack-editor-icon-btn" title="Upload .prat file" onClick={() => fileInputRef.current?.click()}>
        <LuUpload />
      </button>

      <button className="pack-editor-icon-btn" title="Download .prat file" onClick={handleDownload}>
        <LuDownload />
      </button>

      {status === 'ok' &&
        <button className="pack-editor-icon-btn" title="Apply" onClick={handleApplyPack}>
          <LuCheck />
        </button>
      }

      <button className="pack-editor-icon-btn" title={collapsed ? 'Expand' : 'Collapse'} onClick={handleToggleCollapsed}>
        {collapsed ? <LuChevronDown /> : <LuChevronUp />}
      </button>

      <button className="pack-editor-icon-btn" title="Close" onClick={handleClose}>
        <LuX />
      </button>

      <input ref={fileInputRef} type="file" accept=".prat" style={{ display: 'none' }} onChange={handleFileChange}/>

    </div>
  );
};

export default AtlasEditorHeader;