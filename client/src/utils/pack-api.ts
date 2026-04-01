import type { GamePack } from "../models";

export interface PackParseSuccess { pack: GamePack; errors?: never };
export interface PackParseError { errors: string[]; pack?: never };
export type PackParseResult = PackParseSuccess | PackParseError;

async function handleResponse(res: Response): Promise<PackParseResult> {
    if (!res.ok) {
        return { errors: [`Server error: ${res.status.toString()} ${res.statusText}`] };
    }
    const body = await res.json() as { result?: GamePack; errors?: string[] };
    if (body.errors) {
        return { errors: body.errors };
    }
    return { pack: body.result as GamePack };
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
