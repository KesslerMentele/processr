import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface IconRecord {
    id: string;
    label: string | null;
    mime: string;
}

export interface StoredIcon extends IconRecord {
    data: Uint8Array;
}

const DEFAULT_DB_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../data/icons.db');

const DATA_URL_PATTERN = /^data:([^;,]+);base64,(.+)$/;

let db: DatabaseSync | undefined;

function getDb(): DatabaseSync {
    if (!db) {
        throw new Error('Icon store not initialized — call initIconStore() first.');
    }
    return db;
}

/** Opens the icon database (creating the table if missing). Pass `:memory:` in tests for isolation. */
export function initIconStore(dbPath: string = DEFAULT_DB_PATH): void {
    if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec(`
        CREATE TABLE IF NOT EXISTS icons (
            id TEXT PRIMARY KEY,
            label TEXT,
            mime TEXT NOT NULL,
            data BLOB NOT NULL,
            created_at TEXT NOT NULL
        )
    `);
}

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
