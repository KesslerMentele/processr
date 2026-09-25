import { createHash } from 'node:crypto';
import { getDb } from '../db/store.js';

export interface IconRecord {
    id: string;
    label: string | null;
    mime: string;
}

export interface StoredIcon extends IconRecord {
    data: Uint8Array;
}

const DATA_URL_PATTERN = /^data:([^;,]+);base64,(.+)$/;

function parseDataUrl(dataUrl: string): { mime: string; data: Buffer } {
    const match = DATA_URL_PATTERN.exec(dataUrl);
    if (!match) {
        throw new Error('Expected a base64 data URL (data:<mime>;base64,<data>)');
    }
    const [, mime, base64] = match;
    return { mime, data: Buffer.from(base64, 'base64') };
}

/** Stores an icon, deduping by content hash — re-uploading the same image returns the existing record. */
export function addIcon(dataUrl: string, label?: string): IconRecord {
    const { mime, data } = parseDataUrl(dataUrl);
    const id = createHash('sha256').update(data).digest('hex');

    const existing = getDb()
        .prepare('SELECT id, label, mime FROM icons WHERE id = ?')
        .get(id) as unknown as IconRecord | undefined;
    if (existing) return existing;

    getDb()
        .prepare('INSERT INTO icons (id, label, mime, data, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, label ?? null, mime, data, new Date().toISOString());

    return { id, label: label ?? null, mime };
}

export function listIcons(): IconRecord[] {
    return getDb()
        .prepare('SELECT id, label, mime FROM icons ORDER BY created_at DESC')
        .all() as unknown as IconRecord[];
}

export function getIcon(id: string): StoredIcon | null {
    const row = getDb()
        .prepare('SELECT id, label, mime, data FROM icons WHERE id = ?')
        .get(id) as unknown as StoredIcon | undefined;
    return row ?? null;
}
