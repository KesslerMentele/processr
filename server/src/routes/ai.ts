import { Router, type Request, type Response } from 'express';
import { generateAtlas, inferGame } from '../ai/generate.js';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
    const { prompt, currentPack, mode } = req.body as {
        prompt?: string;
        currentPack?: string;
        mode?: 'generate' | 'append';
    };
    console.log('[route] generate hit — prompt:', prompt);

    if (!prompt?.trim()) {
        res.status(400).json({ error: 'prompt is required' });
        return;
    }

    const game = await inferGame(prompt);
    if (!game) {
        res.status(400).json({ error: 'Could not determine which game your prompt is about. Try mentioning the game name (e.g. "Factorio").' });
        return;
    }
    console.log('[route] inferred game:', game);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();
    console.log('[route] headers flushed, starting generation');

    try {
        let chunkCount = 0;
        for await (const chunk of generateAtlas(prompt, currentPack ?? '', game, mode)) {
            chunkCount++;
            console.log(`[route] chunk ${chunkCount}: ${JSON.stringify(chunk)}`);
            res.write(JSON.stringify({ chunk }) + '\n');
        }
        console.log(`[route] done — ${chunkCount} chunks sent`);
        res.write(JSON.stringify({ done: true }) + '\n');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[route] error:', message);
        res.write(JSON.stringify({ error: message }) + '\n');
    }

    res.end();
});

export default router;