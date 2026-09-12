import { describe, it, expect } from "vitest";
import { createUISlice } from "../state/ui-slice.ts";
import type { ContextMenuProps } from "../models/contextMenu.ts";
import type { UISettingsSlice } from "../models";

/** Minimal Zustand-style harness: only `set` is exercised by this slice's actions. */
function createHarness() {
  const stateRef = { current: undefined as unknown as UISettingsSlice };
  const set = (updater: (s: UISettingsSlice) => Partial<UISettingsSlice>) => {
    // eslint-disable-next-line functional/immutable-data
    stateRef.current = { ...stateRef.current, ...updater(stateRef.current) };
  };
  // eslint-disable-next-line functional/immutable-data
  stateRef.current = createUISlice(set as never, (() => stateRef.current) as never, {} as never);
  return { getState: () => stateRef.current };
}

const menuA: ContextMenuProps = { x: 10, y: 20, data: { target: 'Canvas' }, items: [] };
const menuB: ContextMenuProps = { x: 30, y: 40, data: { target: 'Sidebar' }, items: [] };

describe('toggleContextMenu', () => {
  it('opens the menu with the given data', () => {
    const { getState } = createHarness();
    getState().toggleContextMenu(menuA);
    expect(getState().contextMenuOpen).toBe(true);
    expect(getState().contextMenuData).toBe(menuA);
  });

  it('closes the menu when passed null', () => {
    const { getState } = createHarness();
    getState().toggleContextMenu(menuA);
    getState().toggleContextMenu(null);
    expect(getState().contextMenuOpen).toBe(false);
    expect(getState().contextMenuData).toBeNull();
  });

  // Regression: selecting a menu item fires toggleContextMenu(null) twice in
  // the same click (once from the item itself, once bubbled to App's
  // click-away handler). The old implementation toggled off the *current*
  // contextMenuOpen state rather than setting directly from the argument, so
  // two closes in a row cancelled out and left the menu open with no data —
  // which then made the *next* right-click close it instead of opening.
  it('stays closed when toggled closed twice in a row', () => {
    const { getState } = createHarness();
    getState().toggleContextMenu(menuA);
    getState().toggleContextMenu(null);
    getState().toggleContextMenu(null);
    expect(getState().contextMenuOpen).toBe(false);
    expect(getState().contextMenuData).toBeNull();
  });

  it('switches to new data when opened again while already open', () => {
    const { getState } = createHarness();
    getState().toggleContextMenu(menuA);
    getState().toggleContextMenu(menuB);
    expect(getState().contextMenuOpen).toBe(true);
    expect(getState().contextMenuData).toBe(menuB);
  });
});
