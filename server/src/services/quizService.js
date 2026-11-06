import { questions } from '../data/questions.js';

export function istDateString(date = new Date(), timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export async function ensureDailyQuiz(
  store,
  { timeZone = 'Asia/Kolkata', now = new Date() } = {}
) {
  const date = istDateString(now, timeZone);
  const existing = await store.findToday(date);
  if (existing) return { quiz: existing, created: false };

  const dayNumber = (await store.count()) + 1;
  const usedQuestionIds = new Set(await store.usedQuestionIds());

  let candidates = questions.filter((item) => !usedQuestionIds.has(item.id));
  if (candidates.length === 0) candidates = questions;

  const template = candidates[(dayNumber - 1) % candidates.length];

  const data = {
    questionId: template.id,
    dayNumber,
    date,
    topic: template.topic,
    language: template.language,
    question: template.question,
    code: template.code || '',
    options: template.options,
    answer: template.answer,
    explanation: template.explanation,
    status: 'draft',
  };

  try {
    const quiz = await store.insert(data);
    return { quiz, created: true };
  } catch (error) {
    if (error && error.code === 11000) {
      const raced = await store.findToday(date);
      if (raced) return { quiz: raced, created: false };
    }
    throw error;
  }
}

export function formatWhatsAppQuestion(quiz) {
  const day = String(quiz.dayNumber).padStart(2, '0');
  const lines = [
    'YuvaHive Daily Coding Challenge',
    `Day ${day} | ${quiz.language} | ${quiz.topic}`,
    '',
    quiz.question,
  ];

  if (quiz.code) {
    lines.push('', '```', quiz.code, '```');
  }

  lines.push('');
  for (const option of quiz.options) {
    lines.push(`${option.key}) ${option.text}`);
  }
  lines.push('', 'Reply in the group with your answer.');
  return lines.join('\n');
}

export function formatWhatsAppAnswer(quiz) {
  return [
    `Answer: ${quiz.answer}`,
    '',
    quiz.explanation,
    '',
    'YuvaHive Daily Coding Challenge',
  ].join('\n');
}

export function withWhatsApp(quiz) {
  if (!quiz) return quiz;
  return {
    ...quiz,
    whatsappQuestion: formatWhatsAppQuestion(quiz),
    whatsappAnswer: formatWhatsAppAnswer(quiz),
  };
}
