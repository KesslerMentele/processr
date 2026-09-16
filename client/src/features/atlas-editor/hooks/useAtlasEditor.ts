import { type RefObject, useEffect, useRef, useState } from 'react';
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
import { type AtlasIndex } from '../../../models';
import type { AtlasEditorView } from "../atlas-types.ts";

const makeEditorView = (
  container: HTMLDivElement,
  doc: string,
  onUpdate: () => void,
): EditorView =>
  new EditorView({
    state: CodeMirrorEditorState.create({
      doc,
      extensions: [
        basicSetup,
        oneDark,
        atlasLanguage,
        atlasColorPicker,
        EditorView.updateListener.of(update => {
          if (update.docChanged) onUpdate();
        }),
      ],
    }),
    parent: container,
  });

const dispatchSections = (
  views: Record<AtlasTab, EditorView | null>,
  sections: Record<AtlasTab, string>,
) => {
  ATLAS_TABS.forEach(tab => {
    const view = views[tab];
    if (!view) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: sections[tab] } });
  });
};

const useTabContainerRefs = (): Record<AtlasTab, RefObject<HTMLDivElement | null>> => ({
  atlas:   useRef<HTMLDivElement>(null),
  items:   useRef<HTMLDivElement>(null),
  nodes:   useRef<HTMLDivElement>(null),
  recipes: useRef<HTMLDivElement>(null),
});

export const useAtlasEditor = (
  atlasIndex: AtlasIndex,
  onDocChange: (text: string) => void,
): AtlasEditorView => {
  const atlasIndexRef  = useRef(atlasIndex);
  const containerRefs  = useTabContainerRefs();
  const tabViewsRef    = useRef<Record<AtlasTab, EditorView | null>>({
    atlas: null, items: null, nodes: null, recipes: null,
  });
  const [focused,   setFocused]       = useState(false);
  const [activeTab, setActiveTabState] = useState<AtlasTab>('atlas');

  const setActiveTab = (tab: AtlasTab) => {
     
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
    const containers = ATLAS_TABS.reduce((acc, tab) => ({
      ...acc,
      [tab]: containerRefs[tab].current,
    }), {} as Record<AtlasTab, HTMLDivElement | null>);

    if (ATLAS_TABS.some(tab => !containers[tab])) return;

    const savedText   = loadAtlasEditorText();
    const initialText = savedText ?? `// Atlas: ${atlasIndexRef.current.atlas.name}\n`;
    const sections    = splitAtlasText(initialText);
    const onUpdate    = () => {
      onDocChange(getCurrentText());
    };

    const views = ATLAS_TABS.reduce((acc, tab) => ({
      ...acc,
      [tab]: makeEditorView(containers[tab] as HTMLDivElement, sections[tab], onUpdate),
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
      void serializeAtlasToText(atlasIndexRef.current.atlas).then(text => {
        dispatchSections(tabViewsRef.current, splitAtlasText(text));
      });
    }

    return () => {
      containerList.forEach(c => {
        c.removeEventListener('focusin',  onFocusIn);
        c.removeEventListener('focusout', onFocusOut);
      });
      ATLAS_TABS.forEach(tab => { views[tab].destroy(); });
    };
  }, []);

  const replaceAll = (text: string) => {
    dispatchSections(tabViewsRef.current, splitAtlasText(text));
  };

  return { containerRefs, activeTab, setActiveTab, focused, getCurrentText, replaceAll };
};
