// Types mirroring the JSON shape produced by buildGamePackJson in the CLI generator.

export interface GamepackJson {
    id: string;
    name: string;
    gameName?: string;
    version: string;
    gameVersion?: string;
    description?: string;
    author?: string;
    url?: string;
    categories: CategoryJson[];
    items: ItemJson[];
    nodeTemplates: NodeTemplateJson[];
    recipes: RecipeJson[];
    metadata: Record<string, unknown>;
}

export interface CategoryJson {
    id: string;
    name: string;
    display: { label: string; description?: string; icon?: string; color?: string };
    sortOrder?: number;
    parentId?: string;
}

export interface ItemJson {
    id: string;
    name: string;
    display: { label: string; description?: string; icon: string; color?: string };
    categoryId?: string;
    form?: string;
    metadata: Record<string, unknown>;
}

export interface PortJson {
    id: string;
    name: string;
    direction: string;
    position: number;
}

export interface NodeTemplateJson {
    id: string;
    name: string;
    display: { label: string; description?: string; icon?: string; color?: string };
    categoryId?: string;
    ports: PortJson[];
    stats: { speedMultiplier: number; powerConsumption?: number; moduleSlots?: number };
    tags: string[];
    metadata: Record<string, unknown>;
}

export interface RecipeJson {
    id: string;
    name: string;
    display: { label: string; description?: string; icon?: string; color?: string };
    categoryId?: string;
    inputs: { itemId: string; amount: number }[];
    outputs: { itemId: string; amount: number }[];
    duration: number;
    durationUnit: 'second' | 'minute' | 'hour';
    compatibleNodeTypes: string[];
    compatibleNodeTags?: string[];
    metadata: Record<string, unknown>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function inferName(id: string): string {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function q(s: string): string {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function unmapDurationUnit(unit: string): string {
    switch (unit) {
        case 'minute': return 'min';
        case 'hour':   return 'hr';
        default:       return 'sec';
    }
}

// ── serializer ───────────────────────────────────────────────────────────────

export function serializeGamepack(pack: GamepackJson): string {
    const lines: string[] = [];

    lines.push(`gamepack ${pack.id} {`);
    if (pack.name !== inferName(pack.id)) lines.push(`    name ${q(pack.name)}`);
    if (pack.gameName)    lines.push(`    game ${q(pack.gameName)}`);
    lines.push(`    version ${q(pack.version)}`);
    if (pack.gameVersion) lines.push(`    gameVersion ${q(pack.gameVersion)}`);
    if (pack.description) lines.push(`    description ${q(pack.description)}`);
    if (pack.author)      lines.push(`    author ${q(pack.author)}`);
    if (pack.url)         lines.push(`    url ${q(pack.url)}`);
    lines.push('}', '');

    for (const cat of pack.categories) {
        const hasBody = cat.name !== inferName(cat.id)
            || cat.display.description || cat.display.icon || cat.display.color
            || cat.sortOrder !== undefined || cat.parentId;
        if (hasBody) {
            lines.push(`category ${cat.id} {`);
            if (cat.name !== inferName(cat.id))  lines.push(`    name ${q(cat.name)}`);
            if (cat.display.description)         lines.push(`    description ${q(cat.display.description)}`);
            if (cat.display.icon)                lines.push(`    icon ${q(cat.display.icon)}`);
            if (cat.display.color)               lines.push(`    color ${q(cat.display.color)}`);
            if (cat.sortOrder !== undefined)      lines.push(`    sortOrder ${cat.sortOrder}`);
            if (cat.parentId)                    lines.push(`    parent ${cat.parentId}`);
            lines.push('}');
        } else {
            lines.push(`category ${cat.id}`);
        }
        lines.push('');
    }

    for (const item of pack.items) {
        const defaultIcon = `/icons/${item.id}.png`;
        const hasBody = item.name !== inferName(item.id)
            || item.display.description
            || item.display.icon !== defaultIcon
            || item.display.color || item.categoryId || item.form;
        if (hasBody) {
            lines.push(`item ${item.id} {`);
            if (item.name !== inferName(item.id))       lines.push(`    name ${q(item.name)}`);
            if (item.display.description)               lines.push(`    description ${q(item.display.description)}`);
            if (item.display.icon !== defaultIcon)      lines.push(`    icon ${q(item.display.icon)}`);
            if (item.display.color)                     lines.push(`    color ${q(item.display.color)}`);
            if (item.categoryId)                        lines.push(`    category ${item.categoryId}`);
            if (item.form)                              lines.push(`    form ${item.form}`);
            lines.push('}');
        } else {
            lines.push(`item ${item.id}`);
        }
        lines.push('');
    }

    for (const node of pack.nodeTemplates) {
        lines.push(`node ${node.id} {`);
        if (node.name !== inferName(node.id))          lines.push(`    name ${q(node.name)}`);
        if (node.display.description)                  lines.push(`    description ${q(node.display.description)}`);
        if (node.display.icon)                         lines.push(`    icon ${q(node.display.icon)}`);
        if (node.display.color)                        lines.push(`    color ${q(node.display.color)}`);
        if (node.categoryId)                           lines.push(`    category ${node.categoryId}`);
        if (node.stats.speedMultiplier !== undefined)  lines.push(`    speed ${node.stats.speedMultiplier}`);
        if (node.stats.powerConsumption !== undefined) lines.push(`    power ${node.stats.powerConsumption}`);
        if (node.stats.moduleSlots !== undefined)      lines.push(`    moduleSlots ${node.stats.moduleSlots}`);
        if (node.tags.length > 0)                      lines.push(`    tags [${node.tags.map(q).join(', ')}]`);
        console.log('setting ports for node: ', node.name)
        for (const port of node.ports) {
          console.log('port name set as: ', port.name)
          lines.push(`    port ${port.direction} ${port.name.replaceAll(' ', '-')}`);
        }
        lines.push('}', '');
    }

    for (const recipe of pack.recipes) {
        lines.push(`recipe ${recipe.id} {`);
        if (recipe.name !== inferName(recipe.id))   lines.push(`    name ${q(recipe.name)}`);
        if (recipe.display.description)             lines.push(`    description ${q(recipe.display.description)}`);
        if (recipe.display.icon)                    lines.push(`    icon ${q(recipe.display.icon)}`);
        if (recipe.display.color)                   lines.push(`    color ${q(recipe.display.color)}`);
        if (recipe.categoryId)                      lines.push(`    category ${recipe.categoryId}`);
        lines.push(`    duration ${recipe.duration} ${unmapDurationUnit(recipe.durationUnit)}`);
        for (const inp of recipe.inputs)            lines.push(`    in ${inp.amount} ${inp.itemId}`);
        for (const out of recipe.outputs)           lines.push(`    out ${out.amount} ${out.itemId}`);
        if (recipe.compatibleNodeTypes.length > 0)
            lines.push(`    nodes [${recipe.compatibleNodeTypes.join(', ')}]`);
        if (recipe.compatibleNodeTags && recipe.compatibleNodeTags.length > 0)
            lines.push(`    tags [${recipe.compatibleNodeTags.map(q).join(', ')}]`);
        lines.push('}', '');
    }

    return lines.join('\n').trimEnd() + '\n';
}
