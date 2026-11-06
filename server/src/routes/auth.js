import crypto from 'node:crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const authRouter = Router();

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

authRouter.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const emailOk = safeEqual(email, config.adminEmail);
  const passwordOk = safeEqual(password, config.adminPassword);

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ email, role: 'admin' }, config.jwtSecret, {
    expiresIn: '7d',
  });

  return res.json({ token, user: { email, role: 'admin' } });
});
