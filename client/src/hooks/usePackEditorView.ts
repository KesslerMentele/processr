import { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState as CodeMirrorEditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { parseAtlasText, serializeAtlasToText } from '../utils/pack-api.ts';
import { loadAtlasEditorText } from '../utils/persistence.ts';
import { generatePackText } from '../utils/ai-api.ts';
import { logger } from '../utils/logger.ts';
import type { Atlas, AtlasIndex } from '../models';
import { EditorState } from '../models';
import type { EditorStatus } from '../models';

const DEBOUNCE_MS = 600;

// eslint-disable-next-line functional/no-mixed-types
interface UsePackEditorViewOptions {
  readonly packIndex: AtlasIndex;
  readonly setPack: (pack: Atlas | null) => void;
  readonly setEditorErrors: (errors: string[]) => void;
  readonly setEditorStatus: (status: EditorStatus) => void;
  readonly setAIMode: (mode: boolean) => void;
}

// eslint-disable-next-line functional/no-mixed-types
interface UsePackEditorViewResult {
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly focused: boolean;
  readonly getCurrentText: () => string;
  readonly replaceAll: (text: string) => void;
  readonly appendChunk: (chunk: string) => void;
  readonly handleGenerate: (prompt: string) => Promise<void>;
  readonly abortGenerate: () => void;
}

import type React from 'react';

export const usePackEditorView = ({
  packIndex,
  setPack,
  setEditorErrors,
  setEditorStatus,
  setAIMode,
}: UsePackEditorViewOptions): UsePackEditorViewResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parseGenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);

  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const savedText = loadAtlasEditorText();
    const initialText = savedText ?? `// Pack: ${packIndex.pack.name}\n`;

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

    const debouncedParse = (value: string, gen: number) => {
      if (!value || value.trim() === '') {
        setEditorStatus(EditorState.Idle);
        setEditorErrors([]);
        return;
      }
      void parseAtlasText(value).then((result) => {
        handleParseResult(result, gen);
      });
    };

    const view = new EditorView({
      state: CodeMirrorEditorState.create({
        doc: initialText,
        extensions: [
          basicSetup,
          oneDark,
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            if (isGeneratingRef.current) return;
            setEditorStatus(EditorState.Parsing);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            // eslint-disable-next-line functional/immutable-data
            parseGenRef.current += 1;
            const gen = parseGenRef.current;
            const value = update.state.doc.toString();
            // eslint-disable-next-line functional/immutable-data
            debounceRef.current = setTimeout(() => {
              debouncedParse(value, gen);
            }, DEBOUNCE_MS);
          }),
        ],
      }),
      parent: containerRef.current,
    });

    // eslint-disable-next-line functional/immutable-data
    editorViewRef.current = view;

    const container = containerRef.current;
    const onFocusIn  = () => { setFocused(true); };
    const onFocusOut = () => { setFocused(false); };
    container.addEventListener('focusin', onFocusIn);
    container.addEventListener('focusout', onFocusOut);

    if (!savedText) {
      logger.debug('no pack, making from default');
      void serializeAtlasToText(packIndex.pack).then((text) => {
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
  }, [packIndex.pack, setEditorErrors, setEditorStatus, setPack]);

  const getCurrentText = () => editorViewRef.current?.state.doc.toString() ?? '';

  const replaceAll = (text: string) => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
  };

  const appendChunk = (chunk: string) => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({ changes: { from: view.state.doc.length, insert: chunk } });
  };

  const handleGenerate = async (prompt: string) => {
    const view = editorViewRef.current;
    if (!view) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    // eslint-disable-next-line functional/immutable-data
    abortRef.current = controller;

    const currentPackText = getCurrentText();
    const mode = currentPackText.trim() ? 'append' : 'generate';

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
    await generatePackText(prompt, currentPackText, {
      onChunk: appendChunk,
      onDone: () => { stopGenerating(); setEditorStatus(EditorState.Ok); setAIMode(false); },
      onError: (message) => { stopGenerating(); setEditorErrors([message]); setEditorStatus(EditorState.Error); },
    }, controller.signal, mode);
    stopGenerating();
  };

  const abortGenerate = () => { abortRef.current?.abort(); };

  return { containerRef, focused, getCurrentText, replaceAll, appendChunk, handleGenerate, abortGenerate };
};
