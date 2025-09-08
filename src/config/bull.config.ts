import { registerAs } from '@nestjs/config';

export default registerAs('bull', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  prefix: process.env.REDIS_PREFIX || 'bull:suggested-activity',
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  limiter: {
    max: 1000, // Максимум 1000 задач в минуту
    duration: 60000, // За минуту
  },
  settings: {
    stalledInterval: 30000, // Проверка зависших задач каждые 30 секунд
    maxStalledCount: 1, // Максимум 1 зависшая задача
  },
}));
