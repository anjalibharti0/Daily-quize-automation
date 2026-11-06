import { Router } from 'express';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { getStore } from '../store.js';
import {
  ensureDailyQuiz,
  istDateString,
  withWhatsApp,
} from '../services/quizService.js';

export const quizzesRouter = Router();

quizzesRouter.use(requireAuth);

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function buildQuizUpdate(body) {
  const fields = {};

  const textField = (key, label, { required = true } = {}) => {
    if (body[key] === undefined) return;
    const value = String(body[key]).trim();
    if (required && !value) throw badRequest(`${label} cannot be empty`);
    fields[key] = value;
  };

  textField('topic', 'Topic');
  textField('language', 'Language');
  textField('question', 'Question');
  textField('explanation', 'Explanation');

  if (body.code !== undefined) {
    fields.code = String(body.code);
  }

  if (body.options !== undefined) {
    if (!Array.isArray(body.options) || body.options.length !== 4) {
      throw badRequest('options must be an array of exactly four items');
    }
    fields.options = body.options.map((option, index) => {
      const text = String(option?.text ?? '').trim();
      if (!text) throw badRequest(`Option ${OPTION_KEYS[index]} cannot be empty`);
      return { key: OPTION_KEYS[index], text };
    });
  }

  if (body.answer !== undefined) {
    const answer = String(body.answer).trim().toUpperCase();
    if (!OPTION_KEYS.includes(answer)) {
      throw badRequest('answer must be one of A, B, C or D');
    }
    fields.answer = answer;
  }

  if (Object.keys(fields).length === 0) {
    throw badRequest('No editable fields were provided');
  }

  return fields;
}

quizzesRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const quizzes = await getStore().list(limit);
    return res.json({ quizzes: quizzes.map(withWhatsApp) });
  } catch (error) {
    return next(error);
  }
});

quizzesRouter.get('/today', async (req, res, next) => {
  try {
    const date = istDateString(new Date(), config.timezone);
    const quiz = await getStore().findToday(date);
    if (!quiz) {
      return res.status(404).json({ error: 'No quiz prepared for today yet' });
    }
    return res.json({ quiz: withWhatsApp(quiz) });
  } catch (error) {
    return next(error);
  }
});

quizzesRouter.post('/generate', async (req, res, next) => {
  try {
    const { quiz, created } = await ensureDailyQuiz(getStore(), {
      timeZone: config.timezone,
    });
    return res.status(created ? 201 : 200).json({
      quiz: withWhatsApp(quiz),
      created,
    });
  } catch (error) {
    return next(error);
  }
});

quizzesRouter.patch('/:id', async (req, res, next) => {
  try {
    const fields = buildQuizUpdate(req.body || {});
    const quiz = await getStore().update(req.params.id, fields);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    return res.json({ quiz: withWhatsApp(quiz) });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    return next(error);
  }
});

quizzesRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['draft', 'posted'].includes(status)) {
      return res.status(400).json({ error: 'status must be "draft" or "posted"' });
    }

    const quiz = await getStore().updateStatus(req.params.id, status);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    return res.json({ quiz: withWhatsApp(quiz) });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    return next(error);
  }
});
