export function buildMatchFilter({
  startDate,
  endDate,
  eventTypes
}: {
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
}) {
  const match: any = {};

  if (eventTypes && eventTypes.length > 0) {
    match.event = { $in: eventTypes };
  }

  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = new Date(startDate);
    if (endDate) match.timestamp.$lte = new Date(endDate);
  }

  return match;
}
