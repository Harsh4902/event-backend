import * as express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { eventRouter } from './events/event.controller';
import { analyticsRouter } from './analytics/analytics.controller';
import { config } from './config/configuration';
import { apiKeyRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger'; // <-- Assuming you have a winston logger

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(apiKeyRateLimiter);

app.use('/events', eventRouter);
app.use('/analytics', analyticsRouter);

// Mongo connection
mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    logger.info('✅ MongoDB connected');
    app.listen(8080, () => {
      logger.info('🚀 Server running on port 8080');
    });
  })
  .catch((err) => {
    logger.error('❌ Failed to connect to MongoDB', err);
    process.exit(1); // Exit if DB not connected
  });

// Optional: fallback error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`[Unhandled Error] ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});
