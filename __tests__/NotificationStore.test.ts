import { createNotificationStore } from '../src/store/useNotificationStore';
import type {
  NotificationPermissionStatus,
  NotificationSyncResult,
} from '../src/types/notification';

const scheduledResult: NotificationSyncResult = {
  permissionStatus: 'authorized',
  exactAlarmEnabled: true,
  scheduledCount: 3,
};

function createService(
  synchronize: () => Promise<NotificationSyncResult> = async () =>
    scheduledResult,
) {
  return {
    ensureChannel: jest.fn(async () => 'mindset-reminders'),
    getPermissionStatus: jest.fn<Promise<NotificationPermissionStatus>, []>(
      async () => 'authorized',
    ),
    requestPermission: jest.fn<Promise<NotificationPermissionStatus>, []>(
      async () => 'authorized',
    ),
    synchronize: jest.fn(synchronize),
    cancelManagedNotifications: jest.fn(async () => undefined),
    openNotificationSettings: jest.fn(async () => undefined),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
  };
}

describe('notification runtime store', () => {
  afterEach(() => jest.useRealTimers());

  test('requests permission only when the OS has not decided yet', async () => {
    const service = createService();
    service.getPermissionStatus.mockResolvedValue('not_determined');
    const store = createNotificationStore({ service, getHabits: () => [] });

    expect(await store.getState().syncNow(true)).toBe(true);
    expect(service.requestPermission).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({
      status: 'scheduled',
      permissionStatus: 'authorized',
      scheduledCount: 3,
    });
  });

  test('coalesces an overlapping request into one follow-up synchronization', async () => {
    jest.useFakeTimers();
    let finishFirst: ((value: NotificationSyncResult) => void) | undefined;
    const first = new Promise<NotificationSyncResult>(resolve => {
      finishFirst = resolve;
    });
    const service = createService(
      jest
        .fn<Promise<NotificationSyncResult>, []>()
        .mockImplementationOnce(() => first)
        .mockResolvedValue(scheduledResult),
    );
    const store = createNotificationStore({ service, getHabits: () => [] });

    const firstRequest = store.getState().syncNow();
    await Promise.resolve();
    const overlappingRequest = store.getState().syncNow();
    expect(service.synchronize).toHaveBeenCalledTimes(1);

    finishFirst!(scheduledResult);
    await Promise.all([firstRequest, overlappingRequest]);
    jest.advanceTimersByTime(151);
    await Promise.resolve();
    await Promise.resolve();

    expect(service.synchronize).toHaveBeenCalledTimes(2);
  });
});
