import { Queue, Worker } from 'bullmq';
import { redisConnection as connection } from '../utils/redis';
import { EventModel } from '../events/schemas/event.schema';

export const eventQueue = new Queue('eventQueue', { connection });

new Worker('eventQueue', async (job) => {
  await EventModel.create(job.data);
}, { connection });
