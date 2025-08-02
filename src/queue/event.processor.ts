import { Queue, Worker, Job } from 'bullmq';
import { redisConnection as connection } from '../utils/redis';
import { EventModel } from '../events/schemas/event.schema';
import { logger } from '../utils/logger';
import { incrementLiveEvent } from '../websocket/event-stream';

export const eventQueue = new Queue('eventQueue', { connection });

new Worker('eventQueue', async (job: Job) => {
  try {
    const event = await EventModel.create(job.data);
    logger.info(`[Worker] Event persisted: ${event.event} for userId=${event.userId}`);
    incrementLiveEvent(event.event)
  } catch (error) {
    logger.error(`[Worker] Failed to persist event`, {
      error,
      jobId: job.id,
      data: job.data
    });
    throw error; // Let BullMQ handle retries or move to failed jobs
  }
}, { connection });
