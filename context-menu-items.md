# Context Menu Inventory

Every place a right-click context menu makes sense, and what it should offer.
Goal: enumerate first, then find which items are identical across locations
(candidates for a shared/generic item set) vs. which just *rhyme* thematically
but are wired to different targets (not actually shareable).

## Locations

### Sidebar — blank area
Status: placeholder only

| Item              | Backing action                           | Status |
|-------------------|------------------------------------------|--------|
| Add Item          | `addItem` (`atlas-mutations.ts`)         | exists |
| Add Category      | `addCategory` (`atlas-mutations.ts`)     | exists |
| Add Node Template | `addNodeTemplate` (`atlas-mutations.ts`) | exists |
| Add Recipe        | `addRecipe` (`atlas-mutations.ts`)       | exists |

### Sidebar — a specific NodePicker row (e.g. "Stone Furnace")
Status: not wired

| Item                    | Backing action | Status                     |
|-------------------------|----------------|----------------------------|
| Edit Node Template      | —              | needs `updateNodeTemplate` |
| Duplicate Node Template | —              | needs new                  |
| Delete Node Template    | —              | needs `removeNodeTemplate` |

### Canvas — blank area
Status: placeholder only

| Item                                                 | Backing action                                                 | Status    |
|------------------------------------------------------|----------------------------------------------------------------|-----------|
| Add Node (place a `ProcessorNode` at click position) | `addNode` (needs a template picker — ambiguous which template) | partial   |
| Select All                                           | —                                                              | needs new |
| Clear Graph                                          | `clearProcessrGraph` + `loadGraph` (already in `DevTools.tsx`) | exists    |

### Canvas — a specific node
Status: Delete Node only

| Item                                                            | Backing action                                                                            | Status         |
|-----------------------------------------------------------------|-------------------------------------------------------------------------------------------|----------------|
| Delete Node                                                     | `removeNode`                                                                              | exists — wired |
| Duplicate Node                                                  | `cloneNode` (`graph-factory.ts`) — exists as a pure fn, not yet exposed as a store action | partial        |
| Unstack                                                         | `unstackNode`                                                                             | exists         |
| Assign Recipe (submenu, listing `atlasIndex.recipesByNodeType`) | `setNodeRecipe`                                                                           | exists         |

### Canvas — multiple selected nodes
Status: not wired

| Item                 | Backing action   | Status                                     |
|----------------------|------------------|--------------------------------------------|
| Stack Selected       | `stackNodes`     | exists                                     |
| Assign Recipe to All | `setNodeRecipes` | exists                                     |
| Delete Selected      | —                | needs a batched action (loop `removeNode`) |

### Canvas — an edge
Status: not wired

| Item        | Backing action | Status |
|-------------|----------------|--------|
| Delete Edge | `removeEdge`   | exists |

## Shared / Generic Candidates

- **Add Item / Add Category / Add Node Template / Add Recipe** — identical items,
  identical `onClick`, useful from *any* "no specific target" trigger. Currently
  the only case where "blank sidebar" and "blank canvas" should show the exact
  same list. Real candidate for a shared `atlasAuthoringItems()` helper both
  call sites spread into their own `items` array.
- **Delete** (node / edge / multi-select) — same verb, same rough styling
  (should read as a "danger" action), but a *different* target and action each
  time. Not shareable as logic — at most a shared `dangerItem(label, onClick)`
  styling helper if the menu ever needs visual distinction for destructive
  actions.
- Everything else below (Duplicate, Assign Recipe, Unstack, Stack Selected,
  template CRUD) is genuinely specific to its trigger and shouldn't be
  generalized.
