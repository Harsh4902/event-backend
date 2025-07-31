import { Router } from 'express';
import { CreateEventDto } from './dto/create-event.dto';
import { eventQueue } from '../queue/event.processor';

export const eventRouter = Router();

eventRouter.post('/', async (req, res) => {
  const events: CreateEventDto[] = req.body.events;
  if (!Array.isArray(events) || events.length === 0 || events.length > 10000) {
    return res.status(400).json({ error: 'Invalid batch size' });
  }

  for (const event of events) {
    await eventQueue.add('ingest', event);
  }

  res.status(201).json({ message: 'Events queued successfully', queued: events.length });
});
