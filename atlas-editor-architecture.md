# Atlas Editor Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         ATLAS EDITOR SYSTEM                            │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     AtlasEditor.tsx  (root)                     │   │
│  │                                                                 │   │
│  │  • Wires state + view together                                  │   │
│  │  • Owns the 600ms debounce → parseAtlasText() → loadAtlas()     │   │
│  │  • Pauses global keyboard shortcuts while editor is focused     │   │
│  │  • Applies position/collapsed CSS transforms                    │   │
│  │                                                                 │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │           AtlasEditorHeader.tsx  (toolbar)                │  │   │
│  │  │  • Status badge (idle / parsing / ok / error / applied)   │  │   │
│  │  │  • Upload .prat → parse → replaceAll()                    │  │   │
│  │  │  • Download: serialize → .prat file                       │  │   │
│  │  │  • Apply button: loadAtlas() + save to localStorage       │  │   │
│  │  │  • Collapse/expand toggle                                 │  │   │
│  │  │  • Drag-to-move: mousemove → setEditorPosition()          │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                AtlasTabs.tsx  (tab bar)                   │  │   │
│  │  │  atlas | items | nodes | recipes                          │  │   │
│  │  │  • Reads activeTab, calls setActiveTab()                  │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │               AtlasText.tsx  (editor area)                │  │   │
│  │  │  • 4 div containers, one per tab                          │  │   │
│  │  │  • Only activeTab's container is visible (others hidden)  │  │   │
│  │  │  • Error list rendered below editor                       │  │   │
│  │  │  • CodeMirror mounts into these divs via containerRefs    │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ ═══════════════════════  HOOKS  ══════════════════════════════════════ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  useEditorView.ts  (core hook)                                   │  │
│  │  • Creates 4 CodeMirror EditorView instances (one per tab)       │  │
│  │  • Loads saved text from localStorage (falls back to API)        │  │
│  │  • Tab switch: requestAnimationFrame to remeasure layout         │  │
│  │  • getCurrentText() → joinAtlasText() across all 4 views         │  │
│  │  • replaceAll()     → splitAtlasText() + dispatch to each view   │  │
│  │  • Tracks focus state                                            │  │
│  │  Returns: AtlasEditorView (the interface components consume)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  useEditorState.ts / useEditorHeaderState.ts  (Zustand selectors)│  │
│  │  • Shallow-compare slices to prevent unnecessary re-renders      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ══════════════════════  CODEMIRROR EXTENSIONS  ══════════════════════ │
│                                                                        │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │  atlas-language.ts      │  │  atlas-color-picker.ts               │ │
│  │  Custom DSL syntax:     │  │  Detects color "#RRGGBB" patterns,   │ │
│  │  block/prop/value kws,  │  │  renders clickable colored swatch,   │ │
│  │  strings, numbers, IDs  │  │  opens native color picker on click  │ │
│  └─────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                        │
│  ══════════════════════  UTILITIES  ══════════════════════════════════ │
│                                                                        │
│  ┌────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  atlas-text-tabs.ts        │  │  atlas-api.ts                   │   │
│  │  splitAtlasText()          │  │  parseAtlasText(text) → POST    │   │
│  │    single doc → 4 sections │  │  serializeAtlasToText(pack) →   │   │
│  │    (brace-depth-0 rules)   │  │  parseAtlasFile(file) → upload  │   │
│  │  joinAtlasText()           │  │  downloadAtlasAs()              │   │
│  │    4 sections → single doc │  └─────────────────────────────────┘   │
│  └────────────────────────────┘  ┌─────────────────────────────────┐   │
│                                  │  atlas-index.ts                 │   │
│                                  │  buildAtlasIndex(atlas)         │   │
│                                  │  itemsById, recipesById,        │   │
│                                  │  recipesByNodeType, etc.        │   │
│                                  └─────────────────────────────────┘   │
│                                                                        │
│  ══════════════════════  GLOBAL STATE (Zustand)  ═════════════════════ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  AtlasEditorSlice                                               │   │
│  │  atlasIndex · editorStatus · editorErrors · editorPosition      │   │
│  │  editorCollapsed · editorHelp                                   │   │
│  │  loadAtlas() · togglePackEditor() · setEditorStatus() · ...     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User types** → CodeMirror fires `updateListener` → `onDocChange` in `AtlasEditor` → debounced 600ms → `parseAtlasText()` API call → `loadAtlas()` updates Zustand → components re-render
2. **Tab switch** → `setActiveTab()` in `useEditorView` → `AtlasText` shows/hides divs → `requestAnimationFrame` remeasures the now-visible CodeMirror view
3. **Apply** → header reads `getCurrentText()` (joins all 4 tab views) → `loadAtlas()` + save to `localStorage`
4. **Upload** → file parsed server-side → `replaceAll()` splits new text across all 4 CodeMirror views
5. **Active tab** is local state inside `useEditorView` — everything else lives in Zustand

The key abstraction is `AtlasEditorView` in `atlas-types.ts` — it's the interface that `useEditorView` returns and all three sub-components (`Header`, `Tabs`, `Text`) consume, keeping the CodeMirror internals hidden from the UI layer.
