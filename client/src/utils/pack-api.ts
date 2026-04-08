import type { Atlas } from "../models";

export const serializePackToText = async (pack: Atlas): Promise<string> => {
    const res = await fetch('/api/pack/serialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pack),
    });
    if (!res.ok) throw new Error(`Serialize failed: ${res.statusText}`);
    return res.text();
};

export const downloadPackAs = (text: string, filename: string): void => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    // eslint-disable-next-line functional/immutable-data
    anchor.href = url;
    // eslint-disable-next-line functional/immutable-data
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
};

export interface PackParseSuccess { pack: Atlas; errors?: never }
export interface PackParseError { errors: string[]; pack?: never }
export type PackParseResult = PackParseSuccess | PackParseError;

async function handleResponse(res: Response): Promise<PackParseResult> {
    if (!res.ok) {
        return { errors: [`Server error: ${res.status.toString()} ${res.statusText}`] };
    }
    const body = await res.json() as { result?: Atlas; errors?: string[] };
    if (body.errors) {
        return { errors: body.errors };
    }
    return { pack: body.result as Atlas };
}

export const parsePackText = async (text: string): Promise<PackParseResult> => {
    const res = await fetch('/api/pack/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    return handleResponse(res);
};

export const parsePackFile = async (file: File): Promise<PackParseResult> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/pack/parse-file', { method: 'POST', body: form });
    return handleResponse(res);
};
