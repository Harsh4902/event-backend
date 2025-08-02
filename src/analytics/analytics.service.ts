import { EventModel } from '../events/schemas/event.schema';
import { FunnelRequestDto } from './dto/funnel-request.dto';
import { FunnelResponseDto } from './dto/funnel-response.dto';
import { startOfDay, differenceInDays } from 'date-fns';
import { getCached, setCached } from '../utils/redis';
import { logger } from '../utils/logger';

function buildMatchFilter({ orgId, projectId, event, userId, startDate, endDate, userProperties }: any) {
  const match: any = {
    ...(orgId && { orgId }),
    ...(projectId && { projectId }),
    ...(event && { event }),
    ...(userId && { userId }),
    ...(startDate || endDate ? { timestamp: {} } : {})
  };

  if (startDate) match.timestamp.$gte = new Date(startDate);
  if (endDate) match.timestamp.$lte = new Date(endDate);
  if (userProperties) {
    for (const key in userProperties) {
      match[`properties.${key}`] = userProperties[key];
    }
  }

  return match;
}

export class AnalyticsService {
  static async computeFunnel(req: FunnelRequestDto): Promise<FunnelResponseDto> {
    const cacheKey = `funnel:${JSON.stringify(req)}`;
    const cached = await getCached<FunnelResponseDto>(cacheKey);

    if (cached) {
      logger.info('[Funnel] Cache hit');
      return cached;
    }

    const { orgId, projectId, steps, startDate, endDate } = req;

    logger.info(`[Funnel] Start computing funnel for org=${orgId}, project=${projectId}`);
    logger.debug(`[Funnel] Steps=${JSON.stringify(steps)}, startDate=${startDate}, endDate=${endDate}`);

    const match: any = {
      orgId,
      projectId,
      event: { $in: steps.map(s => s.event) },
    };

    if (startDate) match.timestamp = { ...match.timestamp, $gte: new Date(startDate) };
    if (endDate) match.timestamp = { ...match.timestamp, $lte: new Date(endDate) };

    const start = Date.now();
    const events = await EventModel.aggregate([
      { $match: match },
      { $sort: { userId: 1, timestamp: 1 } },
      {
        $group: {
          _id: '$userId',
          events: { $push: '$event' }
        }
      }
    ]);
    logger.info(`[Funnel] Aggregation completed in ${Date.now() - start}ms`);

    const stepResults = steps.map(step => ({
      step: step.event,
      users: 0
    }));

    for (const { events: userEvents } of events) {
      let lastIdx = -1;
      for (let i = 0; i < steps.length; i++) {
        const nextIdx = userEvents.indexOf(steps[i].event, lastIdx + 1);
        if (nextIdx === -1) break;
        lastIdx = nextIdx;
        stepResults[i].users++;
      }
    }

    const response: FunnelResponseDto = {
      totalUsers: events.length,
      steps: stepResults.map((s, i) => ({
        ...s,
        dropoffFromPrevious: i === 0 ? 0 : stepResults[i - 1].users - s.users
      }))
    };

    await setCached(cacheKey, response, 300);
    logger.info(`[Funnel] Funnel computed and cached`);
    return response;
  }

  static async getUserJourney(userId: string, filters = {}) {
    logger.info(`[Journey] Fetching journey for user=${userId}`);
    logger.debug(`[Journey] Filters: ${JSON.stringify(filters)}`);

    const match = buildMatchFilter({ userId, ...filters });

    const start = Date.now();
    const journey = await EventModel.find(match)
      .select('event timestamp properties')
      .sort({ timestamp: 1 })
      .lean();
    logger.info(`[Journey] Retrieved ${journey.length} events in ${Date.now() - start}ms`);
    return journey;
  }

  static async getRetentionData(cohortEvent: string, days: number) {
    const cacheKey = `retention:${cohortEvent}:${days}`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      logger.info('[Retention] Cache hit');
      return cached;
    }

    logger.info(`[Retention] Calculating for event=${cohortEvent}, days=${days}`);
    const startDate = startOfDay(new Date());
    startDate.setDate(startDate.getDate() - days);

    const cohortEvents = await EventModel.aggregate([
      {
        $match: {
          event: cohortEvent,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$userId',
          firstEventDate: { $min: '$timestamp' },
        },
      },
    ]);
    logger.info(`[Retention] Identified ${cohortEvents.length} users in cohort`);

    const retentionMap: { [key: string]: Set<string> } = {};
    for (let i = 0; i <= days; i++) retentionMap[i] = new Set();

    const userSignupMap: Record<string, Date> = {};
    for (const user of cohortEvents) {
      userSignupMap[user._id] = user.firstEventDate;
    }

    const userIds = Object.keys(userSignupMap);
    if (userIds.length === 0) {
      logger.warn('[Retention] No users found in cohort');
      return [];
    }

    const allEvents = await EventModel.find({
      userId: { $in: userIds },
      timestamp: { $gte: startDate },
    }).lean();
    logger.info(`[Retention] Scanned ${allEvents.length} events across cohort users`);

    for (const event of allEvents) {
      const signupDate = userSignupMap[event.userId];
      const diff = differenceInDays(startOfDay(event.timestamp), startOfDay(signupDate));
      if (diff >= 0 && diff <= days) {
        retentionMap[diff].add(event.userId);
      }
    }

    const retentionData = [];
    for (let i = 0; i <= days; i++) {
      retentionData.push({
        day: i,
        users: Array.from(retentionMap[i]),
        count: retentionMap[i].size,
      });
    }

    await setCached(cacheKey, retentionData, 300);
    logger.info('[Retention] Retention data computed and cached');
    return retentionData;
  }

  static async getEventMetrics(eventName: string, interval: 'daily' | 'weekly', filters = {}) {
    const cacheKey = `metrics:${eventName}:${interval}:${JSON.stringify(filters)}`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      logger.info('[Metrics] Cache hit');
      return cached;
    }

    logger.info(`[Metrics] Computing metrics for event=${eventName}, interval=${interval}`);
    logger.debug(`[Metrics] Filters: ${JSON.stringify(filters)}`);

    const match = buildMatchFilter({ event: eventName, ...filters });
    const groupBy = interval === 'daily' ? '%Y-%m-%d' : '%Y-%U';

    const start = Date.now();
    const results = await EventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: groupBy, date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]);
    logger.info(`[Metrics] Aggregation done in ${Date.now() - start}ms`);

    await setCached(cacheKey, results, 300);
    logger.info('[Metrics] Metrics cached');
    return results;
  }
}