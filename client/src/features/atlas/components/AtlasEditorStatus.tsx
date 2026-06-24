import type { FC } from 'react';
import { LuCheck } from 'react-icons/lu';
import { useEditorState } from '../hooks/useEditorState.ts';
import { saveAtlasEditorText } from '../../../utils/persistence.ts';
import type { AtlasEditorView } from '../atlas-types.ts';

interface AtlasEditorStatusProps {
  onApply: () => void;
  getCurrentText: AtlasEditorView['getCurrentText'];
}

const AtlasEditorStatus: FC<AtlasEditorStatusProps> = ({ onApply, getCurrentText }) => {
  const { status, errors, setStatus } = useEditorState();

  const getLabel = () => {
    switch (status) {
      case 'idle':    return 'Ready';
      case 'parsing': return 'Parsing…';
      case 'ok':      return 'Atlas is Valid';
      case 'error':   return `${errors.length.toString()} error${errors.length === 1 ? '' : 's'}`;
      case 'applied': return 'Atlas applied';
    }
  };

  const handleApply = () => {
    onApply();
    saveAtlasEditorText(getCurrentText());
    setStatus('applied');
  };

  return (
    <>
      <span className={`pack-editor-status pack-editor-status-${status}`}>{getLabel()}</span>
      {status === 'ok' &&
        <button className="pack-editor-icon-btn" title="Apply" onClick={handleApply}>
          <LuCheck />
        </button>
      }
    </>
  );
};

export default AtlasEditorStatus;
