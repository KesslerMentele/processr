import { type RefObject, useRef } from 'react';

import { generatePackText } from '../ai-api.ts';
import type { EditorStatus } from '../../../models';

// eslint-disable-next-line functional/no-mixed-types
interface UseEditorGenerateOptions {
  readonly isGeneratingRef: RefObject<boolean>;
  readonly debounceRef: RefObject<ReturnType<typeof setTimeout> | null>;
  readonly getCurrentText: () => string;
  readonly replaceAll: (text: string) => void;
  readonly appendChunk: (chunk: string) => void;
  readonly setEditorErrors: (errors: string[]) => void;
  readonly setEditorStatus: (status: EditorStatus) => void;
  readonly setAIMode: (mode: boolean) => void;
}

interface UseEditorGenerateResult {
  readonly handleGenerate: (prompt: string) => Promise<void>;
  readonly abortGenerate: () => void;
}

export const useEditorGenerate = ({
  isGeneratingRef,
  debounceRef,
  getCurrentText,
  replaceAll,
  appendChunk,
  setEditorErrors,
  setEditorStatus,
  setAIMode,
}: UseEditorGenerateOptions): UseEditorGenerateResult => {
  const abortRef = useRef<AbortController | null>(null);

  const stopGenerating = () => {
    // eslint-disable-next-line functional/immutable-data
    isGeneratingRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleGenerate = async (prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    // eslint-disable-next-line functional/immutable-data
    abortRef.current = controller;
    // eslint-disable-next-line functional/immutable-data
    isGeneratingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const currentPackText = getCurrentText();
    const mode = currentPackText.trim() ? 'append' : 'generate';

    if (mode === 'generate') { replaceAll(''); } else { appendChunk('\n\n'); }

    setEditorErrors([]);
    setEditorStatus('thinking');
    await generatePackText(prompt, currentPackText, {
      onChunk: appendChunk,
      onDone: () => { stopGenerating(); setEditorStatus('ok'); setAIMode(false); },
      onError: (message) => { stopGenerating(); setEditorErrors([message]); setEditorStatus('error'); },
    }, controller.signal, mode);
    stopGenerating();
  };

  const abortGenerate = () => { abortRef.current?.abort(); };

  return { handleGenerate, abortGenerate };
};
