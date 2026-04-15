export type AtlasTab = 'pack' | 'items' | 'nodes' | 'recipes';

export const ATLAS_TABS: readonly AtlasTab[] = ['pack', 'items', 'nodes', 'recipes'];

export const ATLAS_TAB_LABELS: Record<AtlasTab, string> = {
  pack: 'Pack',
  items: 'Items',
  nodes: 'Nodes',
  recipes: 'Recipes',
};

/**
 * Splits a full Atlas text document into per-tab sections.
 *
 * Assignment rules (applied at brace depth 0):
 *   gamepack / category  → 'pack'
 *   item                 → 'items'
 *   node                 → 'nodes'
 *   recipe               → 'recipes'
 *
 * Lines inside a block (depth > 0) and blank/comment lines between blocks
 * inherit the current section.
 */
export const splitAtlasText = (text: string): Record<AtlasTab, string> => {
  interface Acc {
    readonly currentSection: AtlasTab;
    readonly braceDepth: number;
    readonly sectionLines: Record<AtlasTab, readonly string[]>;
  }

  const initial: Acc = {
    currentSection: 'pack',
    braceDepth: 0,
    sectionLines: { pack: [], items: [], nodes: [], recipes: [] },
  };

  const result = text.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();

    const newSection: AtlasTab = (() => {
      if (acc.braceDepth !== 0 || trimmed.length === 0 || trimmed.startsWith('//')) {
        return acc.currentSection;
      }
      if (trimmed.startsWith('gamepack') || trimmed.startsWith('category')) return 'pack';
      if (trimmed.startsWith('item ') || trimmed === 'item') return 'items';
      if (trimmed.startsWith('node ') || trimmed === 'node') return 'nodes';
      if (trimmed.startsWith('recipe ') || trimmed === 'recipe') return 'recipes';
      return acc.currentSection;
    })();

    const openCount = (line.match(/{/g) ?? []).length;
    const closeCount = (line.match(/}/g) ?? []).length;
    const newDepth = Math.max(0, acc.braceDepth + openCount - closeCount);

    return {
      currentSection: newSection,
      braceDepth: newDepth,
      sectionLines: {
        ...acc.sectionLines,
        [newSection]: [...acc.sectionLines[newSection], line],
      },
    };
  }, initial);

  return {
    pack: result.sectionLines.pack.join('\n').trimEnd(),
    items: result.sectionLines.items.join('\n').trimEnd(),
    nodes: result.sectionLines.nodes.join('\n').trimEnd(),
    recipes: result.sectionLines.recipes.join('\n').trimEnd(),
  };
};

/**
 * Joins per-tab sections back into a single Atlas text document.
 * A blank line separates non-empty sections.
 */
export const joinAtlasText = (sections: Record<AtlasTab, string>): string => {
  const parts = ATLAS_TABS.map(tab => sections[tab].trim()).filter(s => s.length > 0);
  return parts.length > 0 ? parts.join('\n\n') + '\n' : '';
};