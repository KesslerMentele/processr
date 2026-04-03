import OpenAI from 'openai';
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieveChunks } from './retrieval.js';
import { TOOLS, handleToolCall } from './tools.js';

const STORES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'stores');

async function availableGames(): Promise<string[]> {
    try {
        const files = await readdir(STORES_DIR);
        return files.filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
    } catch {
        return [];
    }
}

export async function inferGame(prompt: string): Promise<string | null> {
    const games = await availableGames();
    if (games.length === 0) return null;

    console.log('[infer] available games:', games);

    // Fast path: game ID appears literally in the prompt (case-insensitive)
    const lower = prompt.toLowerCase();
    const directMatch = games.find(g => lower.includes(g.toLowerCase()));
    if (directMatch) {
        console.log('[infer] direct match:', directMatch);
        return directMatch;
    }

    // Slow path: ask the model to identify the game
    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
            role: 'user',
            content:
                `You are classifying a request by which game it refers to. The game id may not appear directly in the message, try to choose one anyways.\n` +
                `Available game IDs: ${games.join(', ')}\n\n` +
                `Request: "${prompt}"\n\n` +
                `Reply with only one of the game IDs above (exactly as written), ` +
                `or "none" if the request is definitely not about any of them.`,
        }],
        max_completion_tokens: 20,
        temperature: 0,
    });

    const raw = response.choices[0].message.content?.trim() ?? 'none';
    console.log('[infer] model response:', JSON.stringify(raw));
    const matched = games.find(g => g.toLowerCase() === raw.toLowerCase());
    console.log('[infer] matched game:', matched ?? 'none');
    return matched ?? null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAX_ATTEMPTS = 5;

const client = new OpenAI();

// Load all grammar docs once at startup and concatenate into a single string.
async function loadGrammar(): Promise<string> {
    const dir = join(__dirname, 'knowledge');
    const files = (await readdir(dir)).filter(f => f.endsWith('.md')).sort();
    const sections = await Promise.all(
        files.map(async f => {
            const text = await readFile(join(dir, f), 'utf-8');
            return `--- ${f} ---\n${text}`;
        })
    );
    return sections.join('\n\n');
}

const grammarPromise = loadGrammar();

function buildSystemPrompt(grammar: string, mode: 'generate' | 'append'): string {
    const modeInstruction = mode === 'append'
        ? [
            'The user has an existing pack. Generate ONLY the new blocks to add — do not rewrite or repeat existing blocks.',
            'Your output will be appended directly after the existing pack content.',
            'You MUST call validate_atlas on your new blocks before calling submit_atlas.',
            'validate_atlas will check your new blocks in context of the existing pack — fix any errors and validate again.',
          ].join('\n')
        : [
            'Generate only valid Atlas syntax. Do not include markdown code fences, explanations, or commentary — raw .prat text only.',
            'You MUST call validate_atlas on your generated text before calling submit_atlas.',
            'If validate_atlas returns errors, fix them and validate again. Do not submit until validation passes.',
          ].join('\n');

    return [
        'You are an expert at writing Atlas (.prat) game pack files for the Processr factory planner.',
        '',
        modeInstruction,
        '',
        '## Atlas Language Reference',
        '',
        grammar,
    ].join('\n');
}

function buildUserMessage(
    prompt: string,
    currentPack: string,
    gameChunks: { source: string; text: string }[],
): string {
    const gameSection = gameChunks.length > 0
        ? '## Game Reference:\n\n' +
          gameChunks.map(c => `--- ${c.source} ---\n${c.text}`).join('\n\n') +
          '\n\n'
        : '';
    const packSection = currentPack.trim()
        ? `## Current pack (for context — reference existing IDs):\n\`\`\`\n${currentPack}\n\`\`\`\n\n`
        : '';
    return `${gameSection}${packSection}## Request:\n${prompt}`;
}

export async function* generateAtlas(
    prompt: string,
    currentPack: string,
    game?: string,
    mode: 'generate' | 'append' = 'generate',
): AsyncGenerator<string> {
    console.log('[generate] starting, mode:', mode, 'prompt:', prompt, game ? `game: ${game}` : '(no game)');

    const grammar = await grammarPromise;

    // Retrieve game-specific chunks only if a game store is available.
    let gameChunks: { source: string; text: string }[] = [];
    if (game) {
        try {
            const embeddingResponse = await client.embeddings.create({
                model: 'text-embedding-3-small',
                input: prompt,
            });
            gameChunks = await retrieveChunks(embeddingResponse.data[0].embedding, game, 5);
            console.log('[generate] retrieved game chunks:', gameChunks.map(c => c.source));
        } catch (err) {
            console.warn('[generate] could not load game store, proceeding without:', (err as Error).message);
        }
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: buildSystemPrompt(grammar, mode) },
        { role: 'user', content: buildUserMessage(prompt, currentPack, gameChunks) },
    ];

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        console.log(`[generate] attempt ${attempt + 1}/${MAX_ATTEMPTS}`);
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            tools: TOOLS,
            tool_choice: 'required',
        });

        const message = response.choices[0].message;
        messages.push(message);

        const toolCalls = message.tool_calls ?? [];
        console.log(`[generate] tool calls: ${toolCalls.map(t => t.type === 'function' ? t.function.name : t.type).join(', ') || 'none'}`);
        if (toolCalls.length === 0) {
            throw new Error('Model responded without a tool call.');
        }

        const toolResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

        for (const toolCall of toolCalls) {
            if (toolCall.type !== 'function') continue;
            const args = JSON.parse(toolCall.function.arguments) as Record<string, string>;
            const result = await handleToolCall(
                toolCall.function.name, args,
                mode === 'append' ? currentPack : undefined,
            );
            console.log(`[generate] tool result: type=${result.type}${result.type === 'validate' ? ` valid=${result.valid}` : ''}${result.type === 'reject' ? ` reason=${result.reason}` : ''}`);

            if (result.type === 'validate') {
                if (!result.valid) {
                    console.log(`[generate] validation errors: ${result.errors.join('; ')}`);
                }
                toolResults.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(
                        result.valid ? { valid: true } : { valid: false, errors: result.errors }
                    ),
                });
            } else if (result.type === 'submit') {
                console.log(`[generate] submitting ${result.text.length} chars`);
                const chunkSize = 40;
                for (let i = 0; i < result.text.length; i += chunkSize) {
                    yield result.text.slice(i, i + chunkSize);
                }
                return;
            } else {
                toolResults.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: result.reason }),
                });
            }
        }

        messages.push(...toolResults);
    }

    throw new Error(`Failed to produce valid Atlas after ${MAX_ATTEMPTS} attempts.`);
}