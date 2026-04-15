import type { Atlas } from "../../models";

export const serializeAtlasToText = async (pack: Atlas): Promise<string> => {
    const res = await fetch('/api/atlas/serialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pack),
    });
    if (!res.ok) throw new Error(`Serialize failed: ${res.statusText}`);
    return res.text();
};

export const downloadAtlasAs = (text: string, filename: string): void => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    // eslint-disable-next-line functional/immutable-data
    anchor.href = url;
    // eslint-disable-next-line functional/immutable-data
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
};

export interface AtlasParseSuccess { pack: Atlas; errors?: never }
export interface AtlasParseError { errors: string[]; pack?: never }
export type AtlasParseResult = AtlasParseSuccess | AtlasParseError;

async function handleResponse(res: Response): Promise<AtlasParseResult> {
    if (!res.ok) {
        return { errors: [`Server error: ${res.status.toString()} ${res.statusText}`] };
    }
    const body = await res.json() as { result?: Atlas; errors?: string[] };
    if (body.errors) {
        return { errors: body.errors };
    }
    return { pack: body.result as Atlas };
}

export const parseAtlasText = async (text: string): Promise<AtlasParseResult> => {
    const res = await fetch('/api/atlas/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    return handleResponse(res);
};

export const parseAtlasFile = async (file: File): Promise<AtlasParseResult> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/atlas/parse-file', { method: 'POST', body: form });
    return handleResponse(res);
};
