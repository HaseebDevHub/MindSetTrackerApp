// Scheduling, snoozing and reconciliation share this queue, including headless
// events, so cancellation cannot race an upload of a stale snooze schedule.
let tail: Promise<unknown> = Promise.resolve();
export function serializeHabitAlerts<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = tail.catch(() => undefined).then(operation);
  tail = result.catch(() => undefined);
  return result;
}
