import { EventModel } from '../events/schemas/event.schema';
import { FunnelRequestDto } from './dto/funnel-request.dto';
import { FunnelResponseDto } from './dto/funnel-response.dto';

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
}
