import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem } from "langium";
import { parseHelper } from "langium/test";
import type { Gamepack } from "atlas-language";
import { createAtlasServices } from "atlas-language";

let parse: ReturnType<typeof parseHelper<Gamepack>>;

beforeAll(() => {
    const services = createAtlasServices(EmptyFileSystem);
    const doParse = parseHelper<Gamepack>(services.Atlas);
    parse = (input) => doParse(input, { validation: true });
});

describe('Validation', () => {

    test('no errors on a valid gamepack', async () => {
        const doc = await parse(`
            gamepack test-pack {
                game: "Factorio"
            }
            item iron-ore
            item iron-plate
            recipe smelt-iron {
                in: 1 iron-ore
                out: 1 iron-plate
            }
        `);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors).toHaveLength(0);
    });

    test('error when game: is missing', async () => {
        const doc = await parse(`
            gamepack test-pack {}
        `);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('game name');
    });

    test('warning when recipe has no inputs', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            item iron-plate
            recipe smelt-iron {
                out: 1 iron-plate
            }
        `);
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.some(w => w.message.includes('no inputs'))).toBe(true);
    });

    test('warning when recipe has no outputs', async () => {
        const doc = await parse(`
            gamepack test-pack { game: "Test" }
            item iron-ore
            recipe smelt-iron {
                in: 1 iron-ore
            }
        `);
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.some(w => w.message.includes('no outputs'))).toBe(true);
    });

});
