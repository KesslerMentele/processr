import { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState as CodeMirrorEditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { atlasLanguage } from '../utils/atlas-language.ts';
import { atlasColorPicker } from '../utils/atlas-color-picker.ts';
import { parseAtlasText, serializeAtlasToText } from '../utils/pack-api.ts';
import { loadAtlasEditorText } from '../utils/persistence.ts';
import { generatePackText } from '../utils/ai-api.ts';
import { logger } from '../utils/logger.ts';
import { splitAtlasText, joinAtlasText, ATLAS_TABS } from '../utils/atlas-text-tabs.ts';
import type { AtlasTab } from '../utils/atlas-text-tabs.ts';
import type { Atlas, AtlasIndex } from '../models';
import { EditorState } from '../models';
import type { EditorStatus } from '../models';

import type React from 'react';

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
  readonly containerRefs: Record<AtlasTab, React.RefObject<HTMLDivElement | null>>;
  readonly activeTab: AtlasTab;
  readonly setActiveTab: (tab: AtlasTab) => void;
  readonly focused: boolean;
  readonly getCurrentText: () => string;
  readonly replaceAll: (text: string) => void;
  readonly appendChunk: (chunk: string) => void;
  readonly handleGenerate: (prompt: string) => Promise<void>;
  readonly abortGenerate: () => void;
}

export const usePackEditorView = ({
  packIndex,
  setPack,
  setEditorErrors,
  setEditorStatus,
  setAIMode,
}: UsePackEditorViewOptions): UsePackEditorViewResult => {
  const packContainerRef    = useRef<HTMLDivElement>(null);
  const itemsContainerRef   = useRef<HTMLDivElement>(null);
  const nodesContainerRef   = useRef<HTMLDivElement>(null);
  const recipesContainerRef = useRef<HTMLDivElement>(null);

  const containerRefs: Record<AtlasTab, React.RefObject<HTMLDivElement | null>> = {
    pack:    packContainerRef,
    items:   itemsContainerRef,
    nodes:   nodesContainerRef,
    recipes: recipesContainerRef,
  };

  const tabViewsRef = useRef<Record<AtlasTab, EditorView | null>>({
    pack: null, items: null, nodes: null, recipes: null,
  });

  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parseGenRef           = useRef(0);
  const abortRef              = useRef<AbortController | null>(null);
  const isGeneratingRef       = useRef(false);
  const generationAccumRef    = useRef('');
  const preGenerationTextRef  = useRef('');

  const [focused,    setFocused]    = useState(false);
  const [activeTab,  setActiveTabState] = useState<AtlasTab>('pack');
  const activeTabRef = useRef<AtlasTab>('pack');

  const setActiveTab = (tab: AtlasTab) => {
    // eslint-disable-next-line functional/immutable-data
    activeTabRef.current = tab;
    setActiveTabState(tab);
  };

  // Remeasure the editor when a tab becomes visible (was hidden via display:none)
  useEffect(() => {
    requestAnimationFrame(() => {
      tabViewsRef.current[activeTab]?.requestMeasure();
    });
  }, [activeTab]);

  useEffect(() => {
    const containers = {
      pack:    packContainerRef.current,
      items:   itemsContainerRef.current,
      nodes:   nodesContainerRef.current,
      recipes: recipesContainerRef.current,
    };

    if (ATLAS_TABS.some(tab => !containers[tab])) return;

    const savedText = loadAtlasEditorText();
    const initialText = savedText ?? `// Pack: ${packIndex.pack.name}\n`;
    const sections = splitAtlasText(initialText);

    const getFullText = () => joinAtlasText(
      ATLAS_TABS.reduce((acc, tab) => ({
        ...acc,
        [tab]: tabViewsRef.current[tab]?.state.doc.toString() ?? '',
      }), {} as Record<AtlasTab, string>)
    );

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

    const makeUpdateListener = () => EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      if (isGeneratingRef.current) return;
      setEditorStatus(EditorState.Parsing);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // eslint-disable-next-line functional/immutable-data
      parseGenRef.current += 1;
      const gen = parseGenRef.current;
      const value = getFullText();
      // eslint-disable-next-line functional/immutable-data
      debounceRef.current = setTimeout(() => {
        debouncedParse(value, gen);
      }, DEBOUNCE_MS);
    });

    const makeView = (container: HTMLDivElement, doc: string): EditorView =>
      new EditorView({
        state: CodeMirrorEditorState.create({
          doc,
          extensions: [basicSetup, oneDark, atlasLanguage, atlasColorPicker, makeUpdateListener()],
        }),
        parent: container,
      });

    const views = ATLAS_TABS.reduce((acc, tab) => ({
      ...acc,
      [tab]: makeView(containers[tab] as HTMLDivElement, sections[tab]),
    }), {} as Record<AtlasTab, EditorView>);

    // eslint-disable-next-line functional/immutable-data
    tabViewsRef.current = views;

    const onFocusIn  = () => { setFocused(true); };
    const onFocusOut = () => { setFocused(false); };

    const containerList = ATLAS_TABS.map(tab => containers[tab] as HTMLDivElement);
    containerList.forEach(c => {
      c.addEventListener('focusin',  onFocusIn);
      c.addEventListener('focusout', onFocusOut);
    });

    if (!savedText) {
      logger.debug('no pack, making from default');
      void serializeAtlasToText(packIndex.pack).then((text) => {
        const splitSections = splitAtlasText(text);
        ATLAS_TABS.forEach(tab => {
          const view = tabViewsRef.current[tab];
          if (!view) return;
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: splitSections[tab] } });
        });
      });
    }

    return () => {
      containerList.forEach(c => {
        c.removeEventListener('focusin',  onFocusIn);
        c.removeEventListener('focusout', onFocusOut);
      });
      ATLAS_TABS.forEach(tab => { views[tab].destroy(); });
    };
  }, [packIndex.pack, setEditorErrors, setEditorStatus, setPack]);

  const getCurrentText = () => joinAtlasText(
    ATLAS_TABS.reduce((acc, tab) => ({
      ...acc,
      [tab]: tabViewsRef.current[tab]?.state.doc.toString() ?? '',
    }), {} as Record<AtlasTab, string>)
  );

  const replaceAll = (text: string) => {
    const sections = splitAtlasText(text);
    ATLAS_TABS.forEach(tab => {
      const view = tabViewsRef.current[tab];
      if (!view) return;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: sections[tab] } });
    });
  };

  const appendChunk = (chunk: string) => {
    if (isGeneratingRef.current) {
      // eslint-disable-next-line functional/immutable-data
      generationAccumRef.current += chunk;
    }
    const view = tabViewsRef.current[activeTabRef.current];
    if (!view) return;
    view.dispatch({ changes: { from: view.state.doc.length, insert: chunk } });
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
      onChunk: appendChunk,
      onDone: () => {
        stopGenerating();
        // Redistribute generated content across the correct tabs
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

  return {
    containerRefs,
    activeTab,
    setActiveTab,
    focused,
    getCurrentText,
    replaceAll,
    appendChunk,
    handleGenerate,
    abortGenerate,
  };
};