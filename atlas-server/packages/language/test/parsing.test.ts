import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import type { Gamepack } from "atlas-language";
import { createAtlasServices, isGamepack } from "atlas-language";

let parse: ReturnType<typeof parseHelper<Gamepack>>;

beforeAll(() => {
    const services = createAtlasServices(EmptyFileSystem);
    parse = parseHelper<Gamepack>(services.Atlas);
});

describe('Parsing', () => {

    test('parses a minimal gamepack', async () => {
        const doc = await parse(`
            gamepack my-pack {
                game: "Factorio"
            }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        expect(isGamepack(doc.parseResult.value)).toBe(true);
        expect(doc.parseResult.value.id).toBe('my-pack');
    });

    test('parses items', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            item iron-ore
            item iron-plate { form: solid }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        expect(doc.parseResult.value.items).toHaveLength(2);
        expect(doc.parseResult.value.items[0].id).toBe('iron-ore');
        expect(doc.parseResult.value.items[1].form[0]).toBe('solid');
    });

    test('parses a node template with ports', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            node electric-furnace {
                speed: 2.0
                tags: ["smelting"]
                port input ore-in
                port output plate-out
            }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        const node = doc.parseResult.value.nodeTemplates[0];
        expect(node.id).toBe('electric-furnace');
        expect(node.speed[0]).toBe(2.0);
        expect(node.ports).toHaveLength(2);
        expect(node.ports[0].direction).toBe('input');
        expect(node.ports[1].direction).toBe('output');
    });

    test('parses a recipe with inputs and outputs', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            item iron-ore
            item iron-plate
            node furnace { port input ore-in  port output plate-out }
            recipe smelt-iron {
                duration: 3.2 sec
                nodes: [furnace]
                in: 1 iron-ore
                out: 1 iron-plate
            }
        `);
        expect(doc.parseResult.parserErrors).toHaveLength(0);
        const recipe = doc.parseResult.value.recipes[0];
        expect(recipe.id).toBe('smelt-iron');
        expect(recipe.duration[0]).toBe(3.2);
        expect(recipe.unit[0]).toBe('sec');
        expect(recipe.inputs).toHaveLength(1);
        expect(recipe.outputs).toHaveLength(1);
    });

});
