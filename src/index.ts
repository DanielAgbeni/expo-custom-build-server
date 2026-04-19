import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import buildRoutes from './routes/builds';
import adminRoutes from './routes/admin';
import { startWorker } from './queues/buildWorker';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT ?? 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[api] Running on :${PORT}`));
    startWorker();
  })
  .catch((err) => {
    console.error('[startup] Failed:', err);
    process.exit(1);
  });