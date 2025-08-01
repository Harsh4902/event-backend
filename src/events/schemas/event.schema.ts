import mongoose, { Schema, Document } from 'mongoose';

export interface Event extends Document {
  userId: string;
  event: string;
  timestamp: Date;
  orgId: string;
  projectId: string;
  properties: Record<string, any>;
}

const EventSchema: Schema = new Schema<Event>({
  userId: { type: String, required: true },
  event: { type: String, required: true },
  timestamp: { type: Date, required: true },
  orgId: { type: String, required: true },
  projectId: { type: String, required: true },
  properties: { type: Schema.Types.Mixed, default: {} },
});

// Indexing
EventSchema.index({ userId: 1 });
EventSchema.index({ eventName: 1 });
EventSchema.index({ timestamp: 1 });
EventSchema.index({ orgId: 1, projectId: 1 });
EventSchema.index({ orgId: 1, projectId: 1, timestamp: 1 });

export const EventModel = mongoose.model<Event>('Event', EventSchema);
