import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem } from "langium";
import { clearDocuments, parseHelper } from "langium/test";
import type { Gamepack } from "atlas-language";
import { createAtlasServices } from "atlas-language";

let services: ReturnType<typeof createAtlasServices>;
let parse: ReturnType<typeof parseHelper<Gamepack>>;

beforeAll(() => {
    services = createAtlasServices(EmptyFileSystem);
    parse = parseHelper<Gamepack>(services.Atlas);
});

afterEach(async () => {
    await clearDocuments(services.shared, []);
});

describe('Linking', () => {

    test('recipe inputs resolve to declared items', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            item iron-ore
            item iron-plate
            recipe smelt-iron {
                in: 1 iron-ore
                out: 1 iron-plate
            }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        const recipe = doc.parseResult.value.recipes[0];
        expect(recipe.inputs[0].item.ref?.id).toBe('iron-ore');
        expect(recipe.outputs[0].item.ref?.id).toBe('iron-plate');
    });

    test('recipe nodes resolve to declared node templates', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            item iron-ore
            item iron-plate
            node electric-furnace {
                port input ore-in
                port output plate-out
            }
            recipe smelt-iron {
                nodes: [electric-furnace]
                in: 1 iron-ore
                out: 1 iron-plate
            }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        const recipe = doc.parseResult.value.recipes[0];
        expect(recipe.compatibleNodes[0].ref?.id).toBe('electric-furnace');
    });

    test('item category resolves to declared category', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            category raw-materials
            item iron-ore { category: raw-materials }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        const item = doc.parseResult.value.items[0];
        expect(item.category[0]?.ref?.id).toBe('raw-materials');
    });

});
