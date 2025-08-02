import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

export const apiKeyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit per API key per window
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey.trim() !== '') {
      return apiKey;
    }

    // Proper fallback using ipKeyGenerator (handles IPv6 correctly)
    return ipKeyGenerator(req.ip);
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
});
