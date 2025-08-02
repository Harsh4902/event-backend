import { broadcastLiveEventCount } from './ws.server';

const liveEventCounts: Record<string, number> = {};

export function incrementLiveEvent(eventType: string) {
  if (!liveEventCounts[eventType]) liveEventCounts[eventType] = 0;
  liveEventCounts[eventType]++;

  broadcastLiveEventCount({
    type: 'LIVE_EVENT_COUNT',
    payload: { ...liveEventCounts }
  });
}
