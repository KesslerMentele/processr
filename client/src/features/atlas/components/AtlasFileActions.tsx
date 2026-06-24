import { type ChangeEvent, type FC, useRef } from 'react';
import { LuDownload, LuUpload } from 'react-icons/lu';
import { downloadAtlasAs, parseAtlasFile } from '../atlas-api.ts';
import { useEditorState } from '../hooks/useEditorState.ts';
import type { AtlasEditorView } from '../atlas-types.ts';
import type { Atlas } from '../../../models';

interface AtlasFileActionsProps {
  view: Pick<AtlasEditorView, 'getCurrentText' | 'replaceAll'>;
}

const AtlasFileActions: FC<AtlasFileActionsProps> = ({ view }) => {
  const { getCurrentText, replaceAll } = view;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { packIndex, loadAtlas, setStatus, setErrors } = useEditorState();

  const applyUploadResult = (atlas: Atlas) => {
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
      applyUploadResult(result.pack);
      replaceAll(text);
    }
    // eslint-disable-next-line functional/immutable-data
    e.target.value = '';
  };

  const handleDownload = () => {
    const filename = `${packIndex.atlas.name.toLowerCase().replaceAll(' ', '-')}.prat`;
    downloadAtlasAs(getCurrentText(), filename);
  };

  return (
    <>
      <button className="pack-editor-icon-btn" title="Upload .prat file" onClick={() => fileInputRef.current?.click()}>
        <LuUpload />
      </button>
      <button className="pack-editor-icon-btn" title="Download .prat file" onClick={handleDownload}>
        <LuDownload />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".prat"
        style={{ display: 'none' }}
        onChange={e => { void handleFileUpload(e); }}
      />
    </>
  );
};

export default AtlasFileActions;
