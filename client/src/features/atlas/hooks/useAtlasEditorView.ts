import { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState as CodeMirrorEditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { atlasLanguage } from '../atlas-language.ts';
import { atlasColorPicker } from '../atlas-color-picker.ts';
import { serializeAtlasToText } from '../atlas-api.ts';
import { loadAtlasEditorText } from '../../../utils/persistence.ts';
import { logger } from '../../../utils/logger.ts';
import { splitAtlasText, joinAtlasText, ATLAS_TABS } from '../atlas-text-tabs.ts';
import type { AtlasTab } from '../atlas-text-tabs.ts';
import type { AtlasIndex } from '../../../models';

import type React from 'react';

// eslint-disable-next-line functional/no-mixed-types
interface UseAtlasEditorViewResult {
  readonly containerRefs: Record<AtlasTab, React.RefObject<HTMLDivElement | null>>;
  readonly activeTab: AtlasTab;
  readonly setActiveTab: (tab: AtlasTab) => void;
  readonly focused: boolean;
  readonly getCurrentText: () => string;
  readonly replaceAll: (text: string) => void;
  readonly appendChunk: (chunk: string) => void;
}

export const useAtlasEditorView = (
  atlasIndex: AtlasIndex
): UseAtlasEditorViewResult => {
  const atlasContainerRef    = useRef<HTMLDivElement>(null);
  const itemsContainerRef   = useRef<HTMLDivElement>(null);
  const nodesContainerRef   = useRef<HTMLDivElement>(null);
  const recipesContainerRef = useRef<HTMLDivElement>(null);

  const containerRefs: Record<AtlasTab, React.RefObject<HTMLDivElement | null>> = {
    atlas:    atlasContainerRef,
    items:   itemsContainerRef,
    nodes:   nodesContainerRef,
    recipes: recipesContainerRef,
  };

  const tabViewsRef = useRef<Record<AtlasTab, EditorView | null>>({
    atlas: null, items: null, nodes: null, recipes: null,
  });

  const [focused,   setFocused]       = useState(false);
  const [activeTab, setActiveTabState] = useState<AtlasTab>('atlas');
  const activeTabRef = useRef<AtlasTab>('atlas');

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

  const getCurrentText = () => joinAtlasText(
    ATLAS_TABS.reduce((acc, tab) => ({
      ...acc,
      [tab]: tabViewsRef.current[tab]?.state.doc.toString() ?? '',
    }), {} as Record<AtlasTab, string>)
  );

  useEffect(() => {
    const containers = {
      atlas:    atlasContainerRef.current,
      items:   itemsContainerRef.current,
      nodes:   nodesContainerRef.current,
      recipes: recipesContainerRef.current,
    };

    if (ATLAS_TABS.some(tab => !containers[tab])) return;

    const savedText = loadAtlasEditorText();
    const initialText = savedText ?? `// Atlas: ${atlasIndex.atlas.name}\n`;
    const sections = splitAtlasText(initialText);

    const makeView = (container: HTMLDivElement, doc: string): EditorView =>
      new EditorView({
        state: CodeMirrorEditorState.create({
          doc,
          extensions: [basicSetup, oneDark, atlasLanguage, atlasColorPicker],
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
      void serializeAtlasToText(atlasIndex.atlas).then((text) => {
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
  }, [atlasIndex.atlas]);

  const replaceAll = (text: string) => {
    const sections = splitAtlasText(text);
    ATLAS_TABS.forEach(tab => {
      const view = tabViewsRef.current[tab];
      if (!view) return;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: sections[tab] } });
    });
  };

  const appendChunk = (chunk: string) => {
    const view = tabViewsRef.current[activeTabRef.current];
    if (!view) return;
    view.dispatch({ changes: { from: view.state.doc.length, insert: chunk } });
  };

  return {
    containerRefs,
    activeTab,
    setActiveTab,
    focused,
    getCurrentText,
    replaceAll,
    appendChunk,
  };
};