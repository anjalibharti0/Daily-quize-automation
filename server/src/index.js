import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import { initStore, getStore } from './store.js';
import { authRouter } from './routes/auth.js';
import { quizzesRouter } from './routes/quizzes.js';
import { ensureDailyQuiz } from './services/quizService.js';
import { startScheduler } from './services/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

const app = express();

app.use(
  cors({
    origin: config.clientOrigins.includes('*') ? true : config.clientOrigins,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, store: getStore().mode, timezone: config.timezone });
});

app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizzesRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

if (fs.existsSync(clientDist)) {
  console.log(`[web] Serving admin build from ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error('[api] Unhandled error:', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Internal server error' });
});

async function bootstrap() {
  await initStore();

  const server = app.listen(config.port, () => {
    console.log(`[api] YuvaHive quiz bot running on http://localhost:${config.port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `[api] Port ${config.port} is already in use. Change PORT in server/.env.`
      );
    } else {
      console.error('[api] Server error:', error);
    }
    process.exit(1);
  });

  startScheduler();

  try {
    const { quiz, created } = await ensureDailyQuiz(getStore(), {
      timeZone: config.timezone,
    });
    console.log(
      created
        ? `[api] Prepared today's quiz (Day ${quiz.dayNumber}, ${quiz.date})`
        : `[api] Today's quiz already exists (${quiz.date})`
    );
  } catch (error) {
    console.error('[api] Could not prepare today\'s quiz:', error);
  }
}

async function shutdown(signal) {
  console.log(`\n[api] ${signal} received, shutting down.`);
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((error) => {
  console.error('[api] Failed to start:', error);
  process.exit(1);
});
