import * as express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { eventRouter } from './events/event.controller';

dotenv.config();
const app = express();
app.use(express.json({limit: '10mb'}));
app.use('/events', eventRouter);
mongoose.connect(process.env.MONGO_URI!).then(() => {
  console.log('MongoDB connected');
  app.listen(8080, () => console.log('Server running on port 8080'));
});
