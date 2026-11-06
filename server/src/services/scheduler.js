import cron from 'node-cron';
import { config } from '../config.js';
import { getStore } from '../store.js';
import { ensureDailyQuiz } from './quizService.js';

export function startScheduler() {
  const valid = cron.validate(config.quizCron);
  if (!valid) {
    console.error(
      `[scheduler] Invalid QUIZ_CRON "${config.quizCron}". Expected something like "0 9 * * *".`
    );
    return;
  }

  console.log(
    `[scheduler] Daily quiz scheduled with "${config.quizCron}" (${config.timezone})`
  );

  cron.schedule(
    config.quizCron,
    async () => {
      try {
        const { quiz, created } = await ensureDailyQuiz(getStore(), {
          timeZone: config.timezone,
        });
        console.log(
          created
            ? `[scheduler] Created quiz for ${quiz.date} (Day ${quiz.dayNumber})`
            : `[scheduler] Quiz for ${quiz.date} already exists`
        );
      } catch (error) {
        console.error('[scheduler] Failed to prepare the daily quiz:', error);
      }
    },
    { timezone: config.timezone }
  );
}
