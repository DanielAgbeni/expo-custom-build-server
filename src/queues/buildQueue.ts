import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { BuildJob } from '../types';

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(process.env.REDIS_USERNAME ? { username: process.env.REDIS_USERNAME } : {}),
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
};

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is required to connect to Redis');
}

export const redisConnection = new IORedis(process.env.REDIS_URL, redisOptions);

export const buildQueue = new Queue<BuildJob>('builds', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});