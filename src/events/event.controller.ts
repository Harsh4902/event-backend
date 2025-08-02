import { Router } from 'express';
import { CreateEventDto } from './dto/create-event.dto';
import { eventQueue } from '../queue/event.processor';
import { logger } from '../utils/logger'; // Make sure this is set up

export const eventRouter = Router();

eventRouter.post('/', async (req, res) => {
  const events: CreateEventDto[] = req.body.events;

  if (!Array.isArray(events) || events.length === 0 || events.length > 10000) {
    logger.warn(`[Ingest] Invalid batch size: received ${Array.isArray(events) ? events.length : 'non-array'}`);
    return res.status(400).json({ error: 'Invalid batch size' });
  }

  logger.info(`[Ingest] Received ${events.length} events for ingestion`);

  try {
    for (const event of events) {
      await eventQueue.add('ingest', event);
    }

    logger.info(`[Ingest] Successfully queued ${events.length} events`);
    res.status(201).json({ message: 'Events queued successfully', queued: events.length });
  } catch (error) {
    logger.error(`[Ingest] Failed to queue events: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to queue events' });
  }
});
