import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { parsePackText } from '../parser/parse.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/parse', async (req: Request, res: Response) => {
    const { text } = req.body as { text?: string };
    if (typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ errors: ['Request body must include a non-empty "text" field.'] });
        return;
    }
    const result = await parsePackText(text);
    res.json(result);
});

router.post('/parse-file', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ errors: ['No file uploaded. Send a .prat file as multipart field "file".'] });
        return;
    }
    const text = req.file.buffer.toString('utf-8');
    const result = await parsePackText(text);
    res.json(result);
});

export default router;
