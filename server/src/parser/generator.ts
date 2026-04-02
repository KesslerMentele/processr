import type { Gamepack } from './ast.js';
import path from 'node:path';
import fs from 'node:fs';
import { extractDestinationAndName } from "./util.js";
/** Scalar properties inside (... | )* are always arrays — grab the first value. */
function first<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[0] : undefined;
}

function inferName(id: string): string {
    return id
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function mapDurationUnit(unit: string): string {
    switch (unit) {
        case 'min': return 'minute';
        case 'hr':  return 'hour';
        default:    return 'second';
    }
}

export function buildGamePackJson(gamepack: Gamepack): object {
    const categories = gamepack.categories.map(cat => {
        const name = first(cat.name) ?? inferName(cat.id);
        return {
            id: cat.id,
            name,
            display: {
                label: name,
                ...(first(cat.description) && { description: first(cat.description) }),
                ...(first(cat.icon)        && { icon: first(cat.icon) }),
                ...(first(cat.color)       && { color: first(cat.color) }),
            },
            ...(first(cat.sortOrder) !== undefined && { sortOrder: first(cat.sortOrder) }),
            ...(first(cat.parent)?.ref             && { parentId: first(cat.parent)!.ref!.id }),
            metadata: {},
        };
    });

    const items = gamepack.items.map(item => {
        const name = first(item.name) ?? inferName(item.id);
        return {
            id: item.id,
            name,
            display: {
                label: name,
                ...(first(item.description) && { description: first(item.description) }),
                icon: first(item.icon) ?? `/icons/${item.id}.png`,
                ...(first(item.color)       && { color: first(item.color) }),
            },
            ...(first(item.category)?.ref && { categoryId: first(item.category)!.ref!.id }),
            ...(first(item.form)          && { form: first(item.form) }),
            metadata: {},
        };
    });

    const nodeTemplates = gamepack.nodeTemplates.map(node => {
        const name = first(node.name) ?? inferName(node.id);
        return {
            id: node.id,
            name,
            display: {
                label: name,
                ...(first(node.description) && { description: first(node.description) }),
                ...(first(node.icon)        && { icon: first(node.icon) }),
                ...(first(node.color)       && { color: first(node.color) }),
            },
            ...(first(node.category)?.ref && { categoryId: first(node.category)!.ref!.id }),
            ports: (() => {
                const inputPorts  = node.ports.filter(p => p.direction === 'input');
                const outputPorts = node.ports.filter(p => p.direction === 'output');
                return node.ports.map(port => {
                    const group = port.direction === 'input' ? inputPorts : outputPorts;
                    const position = (group.indexOf(port) + 1) / (group.length + 1);
                    return {
                        id: port.id,
                        direction: port.direction,
                        label: port.label ?? inferName(port.id),
                        position,
                    };
                });
            })(),
            stats: {
                ...(first(node.speed)       !== undefined && { speed: first(node.speed) }),
                ...(first(node.power)       !== undefined && { power: first(node.power) }),
                ...(first(node.moduleSlots) !== undefined && { moduleSlots: first(node.moduleSlots) }),
            },
            tags: node.tags,
            metadata: {},
        };
    });

    const recipes = gamepack.recipes.map(recipe => {
        const name = first(recipe.name) ?? inferName(recipe.id);
        const rawUnit = first(recipe.unit);
        return {
            id: recipe.id,
            name,
            display: {
                label: name,
                ...(first(recipe.description) && { description: first(recipe.description) }),
                ...(first(recipe.icon)        && { icon: first(recipe.icon) }),
                ...(first(recipe.color)       && { color: first(recipe.color) }),
            },
            ...(first(recipe.category)?.ref && { categoryId: first(recipe.category)!.ref!.id }),
            inputs: recipe.inputs.map(stack => ({
                itemId: stack.item.ref!.id,
                amount: stack.amount,
            })),
            outputs: recipe.outputs.map(stack => ({
                itemId: stack.item.ref!.id,
                amount: stack.amount,
            })),
            duration: first(recipe.duration) ?? 1,
            durationUnit: rawUnit ? mapDurationUnit(rawUnit) : 'second',
            compatibleNodeTypes: recipe.compatibleNodes.map(ref => ref.ref!.id),
            ...(recipe.compatibleTags.length > 0 && { compatibleNodeTags: recipe.compatibleTags }),
            metadata: {},
        };
    });

    const packName = first(gamepack.name) ?? inferName(gamepack.id);
    return {
        id: gamepack.id,
        name: packName,
        gameName: first(gamepack.gameName),
        version: first(gamepack.version) ?? '1.0.0',
        ...(first(gamepack.gameVersion) && { gameVersion: first(gamepack.gameVersion) }),
        ...(first(gamepack.description) && { description: first(gamepack.description) }),
        ...(first(gamepack.author)      && { author: first(gamepack.author) }),
        ...(first(gamepack.url)         && { url: first(gamepack.url) }),
        categories,
        items,
        recipes,
        nodeTemplates,
        metadata: {},
    };
}

export function generateGamePack(gamepack: Gamepack, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;
    const output = buildGamePackJson(gamepack);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, JSON.stringify(output, null, 2));
    return generatedFilePath;
}
