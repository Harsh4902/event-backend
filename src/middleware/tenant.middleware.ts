import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function validateTenant(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const orgId = (req as any).orgId;
  const projectId = (req as any).projectId;

  // Check for mismatches
  if (body.orgId && body.orgId !== orgId) {
    logger.warn(`[TenantValidation] orgId mismatch: expected ${orgId}, got ${body.orgId}`);
    return res.status(400).json({ error: 'orgId mismatch' });
  }

  if (body.projectId && body.projectId !== projectId) {
    logger.warn(`[TenantValidation] projectId mismatch: expected ${projectId}, got ${body.projectId}`);
    return res.status(400).json({ error: 'projectId mismatch' });
  }

  // Auto-inject if missing
  if (!body.orgId) {
    logger.debug(`[TenantValidation] Injecting orgId from API key: ${orgId}`);
    body.orgId = orgId;
  }

  if (!body.projectId) {
    logger.debug(`[TenantValidation] Injecting projectId from API key: ${projectId}`);
    body.projectId = projectId;
  }

  req.body = body;

  next();
}
