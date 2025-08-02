import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const apiKeyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit per API key per window
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey.trim() !== '') {
      return apiKey;
    }

    return ipKeyGenerator(req.ip); // fallback to IP
  },
  handler: (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'] ?? 'unknown';
    logger.warn(`[RateLimiter] Too many requests for API key: ${apiKey}`);
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
});
