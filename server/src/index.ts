import express from 'express';
import cors from 'cors';
import packRouter from './routes/pack.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api/pack', packRouter);
app.use('/api/ai', aiRouter)

app.listen(PORT, () => {
    console.log(`Processr server running on http://localhost:${PORT}`);
});
