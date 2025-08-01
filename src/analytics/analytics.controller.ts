import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { FunnelRequestDto } from './dto/funnel-request.dto';
import { apiKeyAuth } from '../auth/auth.middleware';
import { validateTenant } from '../middleware/tenant.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(apiKeyAuth);
analyticsRouter.use(validateTenant);

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
  const { event, interval = 'daily', startDate, endDate } = req.query;

  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "event"' });
  }

  if (interval !== 'daily' && interval !== 'weekly') {
    return res.status(400).json({ error: 'Invalid interval: must be daily or weekly' });
  }

  try {
    const data = await AnalyticsService.getEventMetrics(
      event,
      interval,
      { startDate : startDate as string, endDate : endDate as string}
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
