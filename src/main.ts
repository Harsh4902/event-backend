import * as express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { eventRouter } from './events/event.controller';
import { analyticsRouter } from './analytics/analytics.controller';
import { config } from './config/configuration';

dotenv.config();
const app = express();
app.use(express.json({limit: '10mb'}));
app.use('/events', eventRouter);
app.use('/analytics',analyticsRouter)

mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log('MongoDB connected');
  app.listen(8080, () => console.log('Server running on port 8080'));
});
