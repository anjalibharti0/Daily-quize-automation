import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  mongodbUri: (process.env.MONGODB_URI || '').trim(),
  dataFile: process.env.DATA_FILE || './data/quizzes.json',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@yuvahive.com').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'YuvaHive@123',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  quizCron: process.env.QUIZ_CRON || '0 9 * * *',
};
