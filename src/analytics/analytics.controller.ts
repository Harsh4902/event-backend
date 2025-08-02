import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { FunnelRequestDto } from './dto/funnel-request.dto';
import { apiKeyAuth } from '../auth/auth.middleware';
import { validateTenant } from '../middleware/tenant.middleware';
import { logger } from '../utils/logger';

export const analyticsRouter = Router();

analyticsRouter.use(apiKeyAuth);
analyticsRouter.use(validateTenant);

// POST /funnels
analyticsRouter.post('/funnels', async (req: Request, res: Response) => {
  const body: FunnelRequestDto = req.body;

  if (!body.orgId || !body.projectId || !Array.isArray(body.steps)) {
    logger.warn('[Funnels] Invalid funnel request body:', body);
    return res.status(400).json({ error: 'Invalid funnel request' });
  }

  try {
    logger.info(`[Funnels] Computing funnel for org=${body.orgId}, project=${body.projectId}`);
    const result = await AnalyticsService.computeFunnel(body);
    logger.info(`[Funnels] Funnel computed successfully`);
    res.status(200).json(result);
  } catch (err) {
    logger.error('[Funnels] Funnel analysis failed:', err);
    res.status(500).json({ error: 'Funnel analysis failed' });
  }
});

// GET /users/:id/journey
analyticsRouter.get('/users/:id/journey', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    logger.info(`[Journey] Fetching journey for user=${userId}`);
    const journey = await AnalyticsService.getUserJourney(userId);
    logger.info(`[Journey] Journey fetched for user=${userId}`);
    res.status(200).json(journey);
  } catch (error) {
    logger.error(`[Journey] Error fetching journey for user=${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /retention
analyticsRouter.get('/retention', async (req: Request, res: Response) => {
  try {
    const { cohort = 'signup', days = 7 } = req.query;
    logger.info(`[Retention] Calculating retention for cohort=${cohort}, days=${days}`);
    const retention = await AnalyticsService.getRetentionData(
      cohort as string,
      parseInt(days as string)
    );
    logger.info(`[Retention] Retention data generated`);
    res.status(200).json(retention);
  } catch (error) {
    logger.error('[Retention] Error calculating retention:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /metrics
analyticsRouter.get('/metrics', async (req, res) => {
  const { event, interval = 'daily', startDate, endDate } = req.query;

  if (!event || typeof event !== 'string') {
    logger.warn('[Metrics] Missing or invalid "event" query param');
    return res.status(400).json({ error: 'Missing or invalid "event"' });
  }

  if (interval !== 'daily' && interval !== 'weekly') {
    logger.warn(`[Metrics] Invalid interval: ${interval}`);
    return res.status(400).json({ error: 'Invalid interval: must be daily or weekly' });
  }

  try {
    logger.info(`[Metrics] Generating metrics for event=${event}, interval=${interval}`);
    const data = await AnalyticsService.getEventMetrics(
      event,
      interval,
      { startDate: startDate as string, endDate: endDate as string }
    );
    logger.info(`[Metrics] Metrics generated successfully`);
    res.json(data);
  } catch (err) {
    logger.error('[Metrics] Server error generating metrics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
