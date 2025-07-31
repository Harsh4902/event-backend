import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
  orgId: String,
  projectId: String,
  userId: String,
  event: String,
  properties: Object,
  timestamp: Date,
  receivedAt: { type: Date, default: Date.now }
});

EventSchema.index({ orgId: 1, projectId: 1, userId: 1, event: 1, timestamp: -1 });

export const EventModel = model('Event', EventSchema);