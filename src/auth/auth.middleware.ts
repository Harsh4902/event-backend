import { Request, Response, NextFunction } from 'express';
import { apiKeyStore } from '../utils/api-key.store';
import { logger } from '../utils/logger';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    logger.warn(`[Auth] Missing API key from ${req.ip}`);
    return res.status(401).json({ error: 'Missing API key' });
  }

  const meta = apiKeyStore.get(apiKey);
  if (!meta) {
    logger.warn(`[Auth] Invalid API key attempted: ${apiKey} from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid API key' });
  }

  logger.info(`[Auth] Authenticated request with API key: ${apiKey} (org=${meta.orgId}, project=${meta.projectId})`);

  (req as any).orgId = meta.orgId;
  (req as any).projectId = meta.projectId;

  next();
}
