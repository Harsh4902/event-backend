import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger';

const clients: Set<WebSocket> = new Set();

export const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info('🔌 WebSocket client connected');

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('❌ WebSocket client disconnected');
  });
});

export function broadcastLiveEventCount(payload: any) {
  const data = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });
}
