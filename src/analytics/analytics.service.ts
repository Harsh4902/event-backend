import { EventModel } from '../events/schemas/event.schema';
import { FunnelRequestDto } from './dto/funnel-request.dto';
import { FunnelResponseDto } from './dto/funnel-response.dto';
import { startOfDay, differenceInDays } from 'date-fns';

export class AnalyticsService {
  static async computeFunnel(req: FunnelRequestDto): Promise<FunnelResponseDto> {
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
      let passed = true;
      let lastIdx = -1;

      for (let i = 0; i < steps.length; i++) {
        const stepEvent = steps[i].event;
        const nextIdx = userEvents.indexOf(stepEvent, lastIdx + 1);
        if (nextIdx === -1) {
          passed = false;
          break;
        }
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

    return response;
  }

  static async getUserJourney(userId: String) {
    return await EventModel.find({ userId })
    .sort({ timestamp: 1 })
    .exec();
  }

  static async getRetentionData(cohortEvent: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Step 1: Get users who performed the cohort event (e.g., signup) in the last `days`
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

  // Initialize retention buckets
  for (let i = 0; i <= days; i++) {
    retentionMap[i] = new Set();
  }

  const userSignupMap: Record<string, Date> = {};
  for (const user of cohortEvents) {
    userSignupMap[user._id] = user.firstEventDate;
  }

  const userIds = Object.keys(userSignupMap);
  if (userIds.length === 0) return [];

  // Step 2: Fetch all events for these users during the period
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

  // Step 3: Format result
  const retentionData = [];
  for (let i = 0; i <= days; i++) {
    retentionData.push({
      day: i,
      users: Array.from(retentionMap[i]),
      count: retentionMap[i].size,
    });
  }

  return retentionData;
  }

  static async getEventMetrics(eventName: string, interval: string) {
    const groupByDateFormat = interval === 'daily' ? '%Y-%m-%d' : '%Y-%U'; // weekly = week number

    return EventModel.aggregate([
        { $match: { event : eventName } },
        {
        $group: {
            _id: {
            $dateToString: { format: groupByDateFormat, date: '$timestamp' }
            },
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
}

}
