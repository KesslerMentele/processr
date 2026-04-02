import type { ChangeEvent, FC, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProcessrStore } from '../state/store.ts';
import { parsePackText, parsePackFile, serializePackToText, downloadPackAs } from '../utils/pack-api.ts';
import type { GamePack } from '../models';
import { LuX, LuUpload, LuDownload, LuCheck, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { savePackEditorText, loadPackEditorText } from '../utils/persistence.ts';
import { useShortcutPause } from 'react-keyhub';

const DEBOUNCE_MS = 600;

const PackEditor: FC = () => {
  const [editorFocused, setEditorFocused] = useState(false);
  useShortcutPause(editorFocused);

  const packIndex = useProcessrStore.use.packIndex();
  const loadGamePack = useProcessrStore.getState().loadGamePack;
  const togglePackEditor = useProcessrStore.use.togglePackEditor();

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parseGenRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const packRef = useRef(packIndex.pack);
  const packNameRef = useRef(packIndex.pack.name);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [collapsed, setCollapsed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ok' | 'error' | 'applied'>('idle');
  const [pack, setPack] = useState<GamePack | null>(null);

  // Initialize CodeMirror once on mount
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const savedText = loadPackEditorText();
    const initialText = savedText ?? `// Pack: ${packNameRef.current}\n`;

    const view = new EditorView({
      state: EditorState.create({
        doc: initialText,
        extensions: [
          basicSetup,
          oneDark,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const value = update.state.doc.toString();
            setStatus('parsing');


            if (debounceRef.current) clearTimeout(debounceRef.current);
            // eslint-disable-next-line functional/immutable-data
            parseGenRef.current += 1;
            const gen = parseGenRef.current;
            // eslint-disable-next-line functional/immutable-data
            debounceRef.current = setTimeout(() => {
              if (!value || value.trim() === '') {
                setStatus('idle');
                setErrors([]);
                return;
              }
              void parsePackText(value).then((result) => {
                if (gen !== parseGenRef.current) return;
                if (result.errors) {
                  setErrors(result.errors);
                  setStatus('error');
                } else {
                  setPack(result.pack);
                  setStatus('ok');
                  setErrors([]);
                }
              });
            }, DEBOUNCE_MS);
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    // eslint-disable-next-line functional/immutable-data
    editorViewRef.current = view;

    const container = editorContainerRef.current;
    const onFocusIn  = () => {
      setEditorFocused(true);
    };
    const onFocusOut = () => {
      setEditorFocused(false);
    };
    container.addEventListener('focusin', onFocusIn);
    container.addEventListener('focusout', onFocusOut);

    // On first open with no saved text, populate with the serialized current pack
    if (!savedText) {
      console.log('no pack, making from default');
      void serializePackToText(packRef.current).then((text) => {
        const v = editorViewRef.current;
        if (!v) return;
        v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } });
      });
    }

    return () => {
      container.removeEventListener('focusin', onFocusIn);
      container.removeEventListener('focusout', onFocusOut);
      view.destroy();
    };
  }, []);

  const getCurrentText = useCallback(
    () => editorViewRef.current?.state.doc.toString() ?? '',
    [],
  );

  const applyResult = useCallback(
    (gamePack: GamePack) => {
      loadGamePack(gamePack);
      setErrors([]);
      setStatus('ok');
    },
    [loadGamePack],
  );

  const handleHeaderMouseDown = useCallback((e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;

    const onMove = (ev: globalThis.MouseEvent) => {
      const newPos = { x: ev.clientX - startX, y: ev.clientY - startY };
      // eslint-disable-next-line functional/immutable-data
      posRef.current = newPos;
      setPos(newPos);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const handleFileUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setStatus('parsing');
      const [result, text] = await Promise.all([parsePackFile(file), file.text()]);
      if (result.errors) {
        setErrors(result.errors);
        setStatus('error');
      } else {
        applyResult(result.pack);
        const view = editorViewRef.current;
        if (view) {
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
        }
      }
      // eslint-disable-next-line functional/immutable-data
      e.target.value = '';
    },
    [applyResult],
  );

  const handleApplyPack = useCallback(() => {
    if (!pack) return;
    applyResult(pack);
    savePackEditorText(getCurrentText());
    setStatus('applied');
  }, [pack, applyResult, getCurrentText]);

  const handleClose = useCallback(() => {
    savePackEditorText(getCurrentText());
    togglePackEditor();
  }, [getCurrentText, togglePackEditor]);

  const handleDownload = useCallback(() => {
    const filename = `${packNameRef.current.toLowerCase().replaceAll(' ', '-')}.prat`;
    downloadPackAs(getCurrentText(), filename);
  }, [getCurrentText]);

  const statusLabel =
    status === 'parsing' ? 'Parsing…' :
    status === 'ok'      ? 'Pack is valid' :
    status === 'error'   ? `${errors.length.toString()} error${errors.length === 1 ? '' : 's'}` :
    status === 'applied' ? 'Pack applied' :
    'Ready';

  return (
    <div
      className={`pack-editor${collapsed ? ' pack-editor--collapsed' : ''}`}
      style={{ transform: `translate(${pos.x.toString()}px, ${pos.y.toString()}px)` }}
    >
      <div className="pack-editor__header" onMouseDown={handleHeaderMouseDown}>
        <span className="pack-editor__title">Pack Editor</span>
        <span className={`pack-editor__status pack-editor__status--${status}`}>{statusLabel}</span>
        <button
          className="pack-editor__icon-btn"
          title="Upload .prat file"
          onClick={() => fileInputRef.current?.click()}
        >
          <LuUpload />
        </button>
        <button
          className="pack-editor__icon-btn"
          title="Download .prat file"
          onClick={handleDownload}
        >
          <LuDownload />
        </button>
        {status === 'ok' && <button
          className="pack-editor__icon-btn"
          title="Apply"
          onClick={handleApplyPack}
        >
          <LuCheck />
        </button>}
        <button
          className="pack-editor__icon-btn"
          title={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => {
            setCollapsed(c => !c);
          }}
        >
          {collapsed ? <LuChevronDown /> : <LuChevronUp />}
        </button>
        <button
          className="pack-editor__icon-btn"
          title="Close"
          onClick={handleClose}
        >
          <LuX />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".prat"
          style={{ display: 'none' }}
          onChange={(e) => { void handleFileUpload(e); }}
        />
      </div>

      <div className="pack-editor__body">
        <div ref={editorContainerRef} className="pack-editor__cm" />
        {errors.length > 0 && (
          <div className="pack-editor__errors">
            {errors.map((err, i) => (
              <div key={i} className="pack-editor__error">{err}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackEditor;