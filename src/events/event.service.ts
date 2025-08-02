import { logger } from '../utils/logger';

export class EventsService {
  static async persist(event: any) {
    try {
      const { EventModel } = await import('./schemas/event.schema');
      await EventModel.create(event);
      logger.info(`[Event Persist] Saved event: ${event.event} for userId=${event.userId}`);
    } catch (err) {
      logger.error('[Event Persist] Failed to save event', { error: err, event });
      throw err;
    }
  }
}