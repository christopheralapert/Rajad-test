import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { tracksRouter } from './routes/tracks.js';
import { maaametRouter } from './routes/maaamet.js';
import { uploadsRouter } from './routes/uploads.js';
import { reviewsRouter } from './routes/reviews.js';

dotenv.config();

const app = express();

app.use(morgan('dev'));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
    credentials: true,
  }),
);

// JSON endpoints (reviews, etc.)
app.use(express.json({ limit: '2mb' }));

// Serve uploaded images
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', immutable: false }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/tracks', tracksRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/maaamet', maaametRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('========== UNHANDLED REJECTION ==========');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('=========================================');
});

process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('========== UNCAUGHT EXCEPTION ==========');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('=========================================');
  process.exit(1);
});
