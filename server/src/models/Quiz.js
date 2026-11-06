import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    dayNumber: { type: Number, required: true },
    date: { type: String, required: true, unique: true, index: true },
    topic: { type: String, required: true },
    language: { type: String, required: true },
    question: { type: String, required: true },
    code: { type: String, default: '' },
    options: { type: [optionSchema], required: true },
    answer: { type: String, required: true },
    explanation: { type: String, required: true },
    status: { type: String, enum: ['draft', 'posted'], default: 'draft' },
    postedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model('Quiz', quizSchema);
