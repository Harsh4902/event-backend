import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { FunnelRequestDto } from './dto/funnel-request.dto';

export const analyticsRouter = Router();

// Handler for `/funnels`

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

// Handler for `/user/{id}/journey`

analyticsRouter.get('/users/:id/journey', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const journey = await AnalyticsService.getUserJourney(userId);
    res.status(200).json(journey);
  } catch (error) {
    console.error('Error fetching user journey:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Handler for `/retention/`

analyticsRouter.get('/retention', async (req: Request, res: Response) => {
  try {
    const { cohort = 'signup', days = 7 } = req.query;
    const retention = await AnalyticsService.getRetentionData(cohort as string, parseInt(days as string));
    res.status(200).json(retention);
  } catch (error) {
    console.error('Error calculating retention:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Handler for `/metrics`

analyticsRouter.get('/metrics', async (req, res) => {
  const { event, interval } = req.query;

  if (!event) {
    return res.status(400).json({ error: 'Missing required "event" parameter' });
  }

  try {
    const metrics = await AnalyticsService.getEventMetrics(event as string, interval as string);
    res.json(metrics);
  } catch (err) {
    console.error('Error in /metrics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
