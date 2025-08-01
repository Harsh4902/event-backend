import { EventModel } from '../events/schemas/event.schema';
import { FunnelRequestDto } from './dto/funnel-request.dto';
import { FunnelResponseDto } from './dto/funnel-response.dto';
import { startOfDay, differenceInDays } from 'date-fns';
import { getCached, setCached } from '../utils/redis';

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
    if (cached) return cached;

    const { orgId, projectId, steps, startDate, endDate } = req;

    const match: any = {
      orgId,
      projectId,
      event: { $in: steps.map(s => s.event) },
    };

    if (startDate) match.timestamp = { ...match.timestamp, $gte: new Date(startDate) };
    if (endDate) match.timestamp = { ...match.timestamp, $lte: new Date(endDate) };

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

    const stepResults = steps.map((step, idx) => ({
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
    return response;
  }

  static async getUserJourney(userId: string, filters = {}) {
    const match = buildMatchFilter({ userId, ...filters });

    return await EventModel.find(match)
      .select('event timestamp properties')
      .sort({ timestamp: 1 })
      .lean();
  }

  static async getRetentionData(cohortEvent: string, days: number) {
    const cacheKey = `retention:${cohortEvent}:${days}`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) return cached;

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

    const retentionMap: { [key: string]: Set<string> } = {};
    for (let i = 0; i <= days; i++) retentionMap[i] = new Set();

    const userSignupMap: Record<string, Date> = {};
    for (const user of cohortEvents) {
      userSignupMap[user._id] = user.firstEventDate;
    }

    const userIds = Object.keys(userSignupMap);
    if (userIds.length === 0) return [];

    const allEvents = await EventModel.find({
      userId: { $in: userIds },
      timestamp: { $gte: startDate },
    }).lean();

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
    return retentionData;
  }

  static async getEventMetrics(eventName: string, interval: 'daily' | 'weekly', filters = {}) {
    const cacheKey = `metrics:${eventName}:${interval}:${JSON.stringify(filters)}`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) return cached;

    const match = buildMatchFilter({ event: eventName, ...filters });

    const groupBy = interval === 'daily' ? '%Y-%m-%d' : '%Y-%U';

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

    await setCached(cacheKey, results, 300);
    return results;
  }
}
