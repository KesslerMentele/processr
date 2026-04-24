import { useRef } from 'react';

import { generatePackText } from '../ai-api.ts';
import { parseAtlasText } from '../atlas-api.ts';
import { EditorState } from '../../../models';
import type { Atlas } from '../../../models';
import type { EditorStatus } from '../../../models';

const DEBOUNCE_MS = 600;

interface UseEditorGenerateOptions {
  readonly getCurrentText: () => string;
  readonly replaceAll: (text: string) => void;
  readonly appendChunk: (chunk: string) => void;
  readonly setPack: (pack: Atlas | null) => void;
  readonly setEditorErrors: (errors: string[]) => void;
  readonly setEditorStatus: (status: EditorStatus) => void;
  readonly setAIMode: (mode: boolean) => void;
}

interface UseEditorGenerateResult {
  readonly handleGenerate: (prompt: string) => Promise<void>;
  readonly abortGenerate: () => void;
  readonly onDocChange: (text: string) => void;
}

export const useEditorGenerate = ({
  getCurrentText,
  replaceAll,
  appendChunk,
  setPack,
  setEditorErrors,
  setEditorStatus,
  setAIMode,
}: UseEditorGenerateOptions): UseEditorGenerateResult => {
  const abortRef             = useRef<AbortController | null>(null);
  const debounceRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parseGenRef          = useRef(0);
  const isGeneratingRef      = useRef(false);
  const generationAccumRef   = useRef('');
  const preGenerationTextRef = useRef('');

  const handleParseResult = (result: Awaited<ReturnType<typeof parseAtlasText>>, gen: number) => {
    if (gen !== parseGenRef.current) return;
    if (result.errors) {
      setEditorErrors(result.errors);
      setEditorStatus(EditorState.Error);
    } else {
      setPack(result.pack);
      setEditorStatus(EditorState.Ok);
      setEditorErrors([]);
    }
  };

  const onDocChange = (text: string) => {
    if (isGeneratingRef.current) return;
    if (!text || text.trim() === '') {
      setEditorStatus(EditorState.Idle);
      setEditorErrors([]);
      return;
    }
    setEditorStatus(EditorState.Parsing);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // eslint-disable-next-line functional/immutable-data
    parseGenRef.current += 1;
    const gen = parseGenRef.current;
    // eslint-disable-next-line functional/immutable-data
    debounceRef.current = setTimeout(() => {
      void parseAtlasText(text).then((result) => {
        handleParseResult(result, gen);
      });
    }, DEBOUNCE_MS);
  };

  const handleGenerate = async (prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    // eslint-disable-next-line functional/immutable-data
    abortRef.current = controller;

    const currentPackText = getCurrentText();
    const mode = currentPackText.trim() ? 'append' : 'generate';

    // eslint-disable-next-line functional/immutable-data
    preGenerationTextRef.current = currentPackText;
    // eslint-disable-next-line functional/immutable-data
    generationAccumRef.current = '';
    // eslint-disable-next-line functional/immutable-data
    isGeneratingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (mode === 'generate') {
      replaceAll('');
    } else {
      appendChunk('\n\n');
    }

    const stopGenerating = () => {
      // eslint-disable-next-line functional/immutable-data
      isGeneratingRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };

    setEditorErrors([]);
    setEditorStatus(EditorState.Thinking);
    await generatePackText(prompt, preGenerationTextRef.current, {
      onChunk: (chunk) => {
        // eslint-disable-next-line functional/immutable-data
        generationAccumRef.current += chunk;
        appendChunk(chunk);
      },
      onDone: () => {
        stopGenerating();
        const fullText = mode === 'generate'
          ? generationAccumRef.current
          : preGenerationTextRef.current + '\n\n' + generationAccumRef.current;
        replaceAll(fullText);
        // eslint-disable-next-line functional/immutable-data
        generationAccumRef.current = '';
        setEditorStatus(EditorState.Ok);
        setAIMode(false);
      },
      onError: (message) => {
        stopGenerating();
        setEditorErrors([message]);
        setEditorStatus(EditorState.Error);
      },
    }, controller.signal, mode);
    stopGenerating();
  };

  const abortGenerate = () => { abortRef.current?.abort(); };

  return { handleGenerate, abortGenerate, onDocChange };
};