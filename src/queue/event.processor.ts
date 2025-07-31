import { Queue, Worker } from 'bullmq';
import { config } from '../config/configuration';
import IORedis from 'ioredis';
import { EventModel } from '../events/schemas/event.schema';

// Redis connection with required option
const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const eventQueue = new Queue('eventQueue', { connection });

new Worker('eventQueue', async (job) => {
  await EventModel.create(job.data);
}, { connection });
