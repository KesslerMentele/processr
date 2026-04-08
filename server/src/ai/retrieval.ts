import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { KnowledgeChunk } from './embed-knowledge.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORES_DIR = join(__dirname, 'stores');

const cache = new Map<string, KnowledgeChunk[]>();

async function loadStore(game: string): Promise<KnowledgeChunk[]> {
    const cached = cache.get(game);
    if (cached) return cached;
    const raw = await readFile(join(STORES_DIR, `${game}.json`), 'utf-8');
    const store = JSON.parse(raw) as KnowledgeChunk[];
    cache.set(game, store);
    return store;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveChunks(
    queryEmbedding: number[],
    game: string,
    topK = 5,
): Promise<KnowledgeChunk[]> {
    const chunks = await loadStore(game);
    return chunks
        .map(chunk => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ chunk }) => chunk);
}