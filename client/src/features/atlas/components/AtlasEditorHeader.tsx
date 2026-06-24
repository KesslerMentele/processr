import { type FC } from 'react';
import { LuChevronDown, LuChevronUp, LuX } from 'react-icons/lu';
import { useEditorState } from '../hooks/useEditorState.ts';
import { useDraggable } from '../hooks/useDraggable.ts';
import type { AtlasEditorView } from '../atlas-types.ts';
import AtlasEditorStatus from './AtlasEditorStatus.tsx';
import AtlasFileActions from './AtlasFileActions.tsx';

interface AtlasEditorHeaderProps {
  view: AtlasEditorView;
  onApply: () => void;
}

const AtlasEditorHeader: FC<AtlasEditorHeaderProps> = ({ view, onApply }) => {
  const { status, collapsed, setCollapsed, setStatus, togglePackEditor, setPosition } = useEditorState();
  const { onMouseDown } = useDraggable(setPosition);

  const handleClose = () => {
    if (status === 'ok' && !window.confirm('You have unapplied changes. Close anyway?')) return;
    setStatus('idle');
    togglePackEditor();
  };

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="pack-editor-header" onMouseDown={onMouseDown}>
      <span className="pack-editor-title">Atlas Editor</span>
      <AtlasEditorStatus onApply={onApply} getCurrentText={view.getCurrentText} />
      <AtlasFileActions view={view} />
      <button className="pack-editor-icon-btn" title={collapsed ? 'Expand' : 'Collapse'} onClick={handleCollapse}>
        {collapsed ? <LuChevronDown /> : <LuChevronUp />}
      </button>
      <button className="pack-editor-icon-btn" title="Close" onClick={handleClose}>
        <LuX />
      </button>
    </div>
  );
};

export default AtlasEditorHeader;
