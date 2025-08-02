import * as dotenv from 'dotenv';
dotenv.config(); // Load env first

import * as express from 'express';
import * as http from 'http';
import mongoose from 'mongoose';
import { eventRouter } from './events/event.controller';
import { analyticsRouter } from './analytics/analytics.controller';
import { config } from './config/configuration';
import { apiKeyRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { wss } from './websocket/ws.server';

const app = express();
const server = http.createServer(app); // <-- For WebSocket upgrade

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(apiKeyRateLimiter);

// Routes
app.use('/events', eventRouter);
app.use('/analytics', analyticsRouter);

// Fallback error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`[Unhandled Error] ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

// WebSocket upgrade handler
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

// Connect MongoDB and start server
mongoose.connect(config.mongoUri)
  .then(() => {
    logger.info('✅ MongoDB connected');
    server.listen(8080, () => {
      logger.info('🚀 HTTP + WebSocket server running on port 8080');
    });
  })
  .catch((err) => {
    logger.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  });
