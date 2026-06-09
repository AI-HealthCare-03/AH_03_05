import { scheduleMedicationNotifications } from '../utils/notifications';

const mockCancelAll = jest.fn();
const mockSchedule = jest.fn();

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: (...args: any[]) => mockCancelAll(...args),
  scheduleNotificationAsync: (...args: any[]) => mockSchedule(...args),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.requireMock('react-native').Platform.OS = 'ios';
});

const BASE_SETTINGS = {
  master: true,
  morning: { on: true, time: '08:00' },
  lunch: { on: true, time: '12:30' },
  dinner: { on: false, time: '18:00' },
};

describe('scheduleMedicationNotifications', () => {
  it('웹에서는 아무것도 실행하지 않음', async () => {
    jest.requireMock('react-native').Platform.OS = 'web';
    await scheduleMedicationNotifications(BASE_SETTINGS as any);
    expect(mockCancelAll).not.toHaveBeenCalled();
  });

  it('master=false면 cancelAll 후 종료', async () => {
    mockCancelAll.mockResolvedValue(undefined);
    await scheduleMedicationNotifications({ ...BASE_SETTINGS, master: false } as any);
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('on인 식사만 스케줄 등록', async () => {
    mockCancelAll.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue(undefined);
    await scheduleMedicationNotifications(BASE_SETTINGS as any);
    expect(mockSchedule).toHaveBeenCalledTimes(2);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ data: { type: 'medication', meal: 'morning' } }) })
    );
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ data: { type: 'medication', meal: 'lunch' } }) })
    );
  });

  it('잘못된 시간 문자열이면 기본값(8:00) 사용', async () => {
    mockCancelAll.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue(undefined);
    await scheduleMedicationNotifications({
      ...BASE_SETTINGS,
      morning: { on: true, time: 'bad' },
    } as any);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ hour: 8, minute: 0 }),
      })
    );
  });

  it('모든 식사 off면 스케줄 없음', async () => {
    mockCancelAll.mockResolvedValue(undefined);
    await scheduleMedicationNotifications({
      master: true,
      morning: { on: false, time: '08:00' },
      lunch: { on: false, time: '12:00' },
      dinner: { on: false, time: '18:00' },
    } as any);
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
