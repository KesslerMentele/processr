/**
 * Offline script: embeds game wiki docs for a specific game and writes a store file.
 *
 * Usage:
 *   npx tsx src/ai/embed-knowledge.ts --game factorio
 *
 * Input:  src/ai/knowledge-input/<game>/   — one .md file per chunk (items, recipes, machines, etc.)
 * Output: src/ai/stores/<game>.json
 *
 * Typical workflow:
 *   1. Scrape wiki pages and clean them with docling (Python) into .md files
 *   2. Drop the .md files into knowledge-input/<game>/
 *   3. Run this script to embed and store them
 *
 * Requires OPENAI_API_KEY in environment (or .env file).
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface KnowledgeChunk {
    source: string;
    text: string;
    embedding: number[];
}

async function main() {
    const gameArg = process.argv.indexOf('--game');
    if (gameArg === -1 || !process.argv[gameArg + 1]) {
        console.error('Usage: npx tsx src/ai/embed-knowledge.ts --game <game-id>');
        process.exit(1);
    }
    const game = process.argv[gameArg + 1];

    const inputDir = join(__dirname, 'knowledge-input', game);
    const storesDir = join(__dirname, 'stores');
    const outputPath = join(storesDir, `${game}.json`);

    const client = new OpenAI();

    const files = (await readdir(inputDir))
        .filter(f => f.endsWith('.md'))
        .sort();

    if (files.length === 0) {
        console.error(`No .md files found in ${inputDir}`);
        process.exit(1);
    }

    console.log(`Embedding ${files.length} files for game "${game}"...`);

    const chunks: KnowledgeChunk[] = [];

    for (const file of files) {
        const text = await readFile(join(inputDir, file), 'utf-8');
        process.stdout.write(`  ${file}... `);

        const response = await client.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });

        chunks.push({ source: file, text, embedding: response.data[0].embedding });
        console.log('done');
    }

    await mkdir(storesDir, { recursive: true });
    await writeFile(outputPath, JSON.stringify(chunks, null, 2));
    console.log(`\nWrote ${chunks.length} chunks to stores/${game}.json`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});