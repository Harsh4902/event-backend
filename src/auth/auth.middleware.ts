import { Request, Response, NextFunction } from 'express';
import { apiKeyStore } from '../utils/api-key.store';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const meta = apiKeyStore.get(apiKey);
  if (!meta) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // Attach org/project metadata to request
  (req as any).orgId = meta.orgId;
  (req as any).projectId = meta.projectId;

  next();
}
