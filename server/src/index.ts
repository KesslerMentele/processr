import express from 'express';
import cors from 'cors';
import atlasRouter from './routes/atlas.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api/atlas', atlasRouter);

app.listen(PORT, () => {
    console.log(`Processr server running on http://localhost:${PORT}`);
});
