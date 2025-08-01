import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { FunnelRequestDto } from './dto/funnel-request.dto';

export const analyticsRouter = Router();

analyticsRouter.post('/funnels', async (req: Request, res: Response) => {
  const body: FunnelRequestDto = req.body;

  if (!body.orgId || !body.projectId || !Array.isArray(body.steps)) {
    return res.status(400).json({ error: 'Invalid funnel request' });
  }

  try {
    const result = await AnalyticsService.computeFunnel(body);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Funnel Error]', err);
    res.status(500).json({ error: 'Funnel analysis failed' });
  }
});
