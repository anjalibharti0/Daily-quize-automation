import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { config } from './config.js';
import { Quiz } from './models/Quiz.js';

class FileStore {
  mode = 'file';

  constructor(filePath) {
    this.filePath = path.resolve(process.cwd(), filePath);
    this.quizzes = [];
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.quizzes = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.quizzes = [];
      await this.persist();
    }
  }

  async persist() {
    const tempFile = `${this.filePath}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(this.quizzes, null, 2), 'utf8');
    await fs.rename(tempFile, this.filePath);
  }

  async findToday(date) {
    return this.quizzes.find((quiz) => quiz.date === date) || null;
  }

  async list(limit = 50) {
    return [...this.quizzes]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          String(b.createdAt).localeCompare(String(a.createdAt))
      )
      .slice(0, limit);
  }

  async count() {
    return this.quizzes.length;
  }

  async usedQuestionIds() {
    return [...new Set(this.quizzes.map((quiz) => quiz.questionId))];
  }

  async insert(data) {
    const now = new Date().toISOString();
    const quiz = {
      _id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.quizzes.push(quiz);
    await this.persist();
    return quiz;
  }

  async update(id, fields) {
    const quiz = this.quizzes.find((item) => item._id === id);
    if (!quiz) return null;
    Object.assign(quiz, fields, { updatedAt: new Date().toISOString() });
    await this.persist();
    return quiz;
  }

  async updateStatus(id, status) {
    const quiz = this.quizzes.find((item) => item._id === id);
    if (!quiz) return null;
    quiz.status = status;
    quiz.postedAt = status === 'posted' ? new Date().toISOString() : null;
    quiz.updatedAt = new Date().toISOString();
    await this.persist();
    return quiz;
  }
}

class MongoStore {
  mode = 'mongo';

  async findToday(date) {
    return Quiz.findOne({ date }).lean();
  }

  async list(limit = 50) {
    return Quiz.find().sort({ date: -1, createdAt: -1 }).limit(limit).lean();
  }

  async count() {
    return Quiz.countDocuments();
  }

  async usedQuestionIds() {
    return Quiz.distinct('questionId');
  }

  async insert(data) {
    const quiz = await Quiz.create(data);
    return quiz.toObject();
  }

  async update(id, fields) {
    return Quiz.findByIdAndUpdate(id, fields, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async updateStatus(id, status) {
    return Quiz.findByIdAndUpdate(
      id,
      {
        status,
        postedAt: status === 'posted' ? new Date() : null,
      },
      { new: true }
    ).lean();
  }
}

let activeStore = null;

export async function initStore() {
  if (config.mongodbUri) {
    try {
      await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 8000,
      });
      await Quiz.init();
      activeStore = new MongoStore();
      console.log('[store] MongoDB connected');
      return activeStore;
    } catch (error) {
      console.error(`[store] MongoDB connection failed: ${error.message}`);
      console.error('[store] Falling back to the local file store.');
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
    }
  }

  activeStore = new FileStore(config.dataFile);
  await activeStore.init();
  console.log(`[store] Using file store: ${activeStore.filePath}`);
  return activeStore;
}

export function getStore() {
  if (!activeStore) throw new Error('Store has not been initialized');
  return activeStore;
}
