import { Request, Response, NextFunction } from 'express';

export function validateTenant(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const orgId = (req as any).orgId;
  const projectId = (req as any).projectId;

  // Optionally: check if request body/query also includes orgId/projectId and validate them
  if (body.orgId && body.orgId !== orgId) {
    return res.status(400).json({ error: 'orgId mismatch' });
  }

  if (body.projectId && body.projectId !== projectId) {
    return res.status(400).json({ error: 'projectId mismatch' });
  }

  // Set these if not present
  if (!body.orgId) body.orgId = orgId;
  if (!body.projectId) body.projectId = projectId;

  req.body = body;

  next();
}
