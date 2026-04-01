/******************************************************************************
 * Adapted from processr-atlas.
 ******************************************************************************/

import type { Gamepack } from './ast.js';
import { createAtlasServices } from './atlas-module.js';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { buildGamePackJson } from './generator.js';

export type ParseResult =
    | { result: object; errors?: never }
    | { errors: string[]; result?: never };

let _parse: ReturnType<typeof parseHelper<Gamepack>> | undefined;

function getParser(): ReturnType<typeof parseHelper<Gamepack>> {
    if (!_parse) {
        const services = createAtlasServices(EmptyFileSystem);
        const doParse = parseHelper<Gamepack>(services.Atlas);
        _parse = (input) => doParse(input, { validation: true });
    }
    return _parse;
}

export async function parsePackText(text: string): Promise<ParseResult> {
    const parse = getParser();
    const doc = await parse(text);

    const parserErrors = doc.parseResult.parserErrors.map(
        e => `line ${e.token.startLine ?? '?'}: ${e.message}`
    );
    if (parserErrors.length > 0) {
        return { errors: parserErrors };
    }

    const validationErrors = (doc.diagnostics ?? [])
        .filter(d => d.severity === 1)
        .map(d => `line ${d.range.start.line + 1}: ${d.message}`);
    if (validationErrors.length > 0) {
        return { errors: validationErrors };
    }

    return { result: buildGamePackJson(doc.parseResult.value) };
}
