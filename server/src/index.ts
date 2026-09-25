import express from 'express';
import cors from 'cors';
import atlasRouter from './routes/atlas.js';
import iconsRouter from './routes/icons.js';
import { initStore } from './db/store.js';

const app = express();
const PORT = 3001;

initStore();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/atlas', atlasRouter);
app.use('/api/icons', iconsRouter);

app.listen(PORT, () => {
    console.log(`Processr server running on http://localhost:${PORT}`);
});
