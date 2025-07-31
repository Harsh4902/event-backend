export class EventsService {
  static async persist(event: any) {
    const { EventModel } = await import('./schemas/event.schema');
    await EventModel.create(event);
  }
}