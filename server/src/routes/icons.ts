import { Router, type Request, type Response } from 'express';
import { addIcon, getIcon, listIcons, type IconRecord } from '../icons/icon-store.js';

const router = Router();

const toSummary = (icon: IconRecord) => ({
    id: icon.id,
    label: icon.label,
    url: `/api/icons/${icon.id}`,
});

router.get('/', (_req: Request, res: Response) => {
    res.json(listIcons().map(toSummary));
});

router.post('/', (req: Request, res: Response) => {
    const { dataUrl, label } = req.body as { dataUrl?: string; label?: string };
    if (typeof dataUrl !== 'string' || dataUrl.trim() === '') {
        res.status(400).json({ errors: ['Request body must include a non-empty "dataUrl" field.'] });
        return;
    }
    try {
        const icon = addIcon(dataUrl, label);
        res.status(201).json(toSummary(icon));
    } catch {
        res.status(400).json({ errors: ['Invalid "dataUrl" — expected a base64 data URL.'] });
    }
});

router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
    const icon = getIcon(req.params.id);
    if (!icon) {
        res.status(404).json({ errors: ['Icon not found.'] });
        return;
    }
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.type(icon.mime).send(Buffer.from(icon.data));
});

export default router;
