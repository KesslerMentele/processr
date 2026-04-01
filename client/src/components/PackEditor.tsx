import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useProcessrStore } from '../state/store.ts';
import { parsePackText, parsePackFile } from '../utils/pack-api.ts';
import type { GamePack } from '../models';
import { LuX, LuUpload } from 'react-icons/lu';

const DEBOUNCE_MS = 600;

const PackEditor: FC = () => {
  const packIndex = useProcessrStore.use.packIndex();
  const loadGamePack = useProcessrStore.getState().loadGamePack;
  const togglePackEditor = useProcessrStore.use.togglePackEditor();

  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ok' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(`# Pack: ${packIndex.pack.name}\n# Edit below or upload a .prat file\n`);
  }, [packIndex.pack.name]);

  const applyResult = useCallback((pack: GamePack) => {
    loadGamePack(pack);
    setErrors([]);
    setStatus('ok');
  }, [loadGamePack]);

  const handleChange = useCallback((value: string) => {
    setText(value);
    setStatus('parsing');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // eslint-disable-next-line functional/immutable-data
    debounceRef.current = setTimeout(async () => {
      const result = await parsePackText(value);
      if (result.errors) {
        setErrors(result.errors);
        setStatus('error');
      } else {
        applyResult(result.pack);
      }
    }, DEBOUNCE_MS);
  }, [applyResult]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('parsing');
    const result = await parsePackFile(file);
    if (result.errors) {
      setErrors(result.errors);
      setStatus('error');
    } else {
      applyResult(result.pack);
    }
    // eslint-disable-next-line functional/immutable-data
    e.target.value = '';
  }, [applyResult]);

  const statusLabel =
    status === 'parsing' ? 'Parsing…' :
    status === 'ok'      ? 'Pack applied' :
    status === 'error'   ? `${errors.length.toString()} error${errors.length === 1 ? '' : 's'}` :
    'Ready';

  return (
    <div className="pack-editor">
      <div className="pack-editor__header">
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
          title="Close"
          onClick={togglePackEditor}
        >
          <LuX />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".prat"
          style={{ display: 'none' }}
          onChange={(e) => {
            void handleFileUpload(e);
          }}
        />
      </div>

      <textarea
        className="pack-editor__textarea"
        value={text}
        onChange={(e) => {
          handleChange(e.target.value);
        }}
        spellCheck={false}
        placeholder="Paste or type .prat content here…"
      />

      {errors.length > 0 && (
        <div className="pack-editor__errors">
          {errors.map((err, i) => (
            <div key={i} className="pack-editor__error">{err}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackEditor;
