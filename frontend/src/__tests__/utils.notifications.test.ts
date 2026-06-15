import {
  scheduleMedicationNotifications,
  registerForPushNotificationsAsync,
} from '../utils/notifications';

const mockCancelAll = jest.fn();
const mockSchedule = jest.fn();
const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockGetDeviceToken = jest.fn();
const mockRegisterFcmToken = jest.fn();

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: (...args: any[]) => mockCancelAll(...args),
  scheduleNotificationAsync: (...args: any[]) => mockSchedule(...args),
  getPermissionsAsync: (...args: any[]) => mockGetPermissions(...args),
  requestPermissionsAsync: (...args: any[]) => mockRequestPermissions(...args),
  getDevicePushTokenAsync: (...args: any[]) => mockGetDeviceToken(...args),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('expo-device', () => ({
  get isDevice() {
    return jest.requireMock('expo-device').__isDevice;
  },
  __isDevice: true,
}));

jest.mock('../api', () => ({
  usersApi: { registerFcmToken: (...args: any[]) => mockRegisterFcmToken(...args) },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.requireMock('react-native').Platform.OS = 'ios';
  jest.requireMock('expo-device').__isDevice = true;
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

describe('registerForPushNotificationsAsync', () => {
  it('웹에서는 등록하지 않고 false', async () => {
    jest.requireMock('react-native').Platform.OS = 'web';
    const result = await registerForPushNotificationsAsync();
    expect(result).toBe(false);
    expect(mockRegisterFcmToken).not.toHaveBeenCalled();
  });

  it('실기기가 아니면(시뮬레이터) 등록하지 않고 false', async () => {
    jest.requireMock('expo-device').__isDevice = false;
    const result = await registerForPushNotificationsAsync();
    expect(result).toBe(false);
    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(mockRegisterFcmToken).not.toHaveBeenCalled();
  });

  it('권한 거부 시 등록하지 않고 false', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });
    const result = await registerForPushNotificationsAsync();
    expect(result).toBe(false);
    expect(mockRegisterFcmToken).not.toHaveBeenCalled();
  });

  it('권한 허용 + 토큰 획득 시 원시 토큰을 백엔드에 등록', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetDeviceToken.mockResolvedValue({ data: 'raw-fcm-token-123' });
    mockRegisterFcmToken.mockResolvedValue(undefined);
    const result = await registerForPushNotificationsAsync();
    expect(result).toBe(true);
    expect(mockRequestPermissions).not.toHaveBeenCalled(); // 이미 granted면 재요청 안 함
    expect(mockRegisterFcmToken).toHaveBeenCalledWith('raw-fcm-token-123');
  });

  it('등록 중 예외가 나도 throw하지 않고 false', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetDeviceToken.mockResolvedValue({ data: 'raw-fcm-token-123' });
    mockRegisterFcmToken.mockRejectedValue(new Error('network'));
    const result = await registerForPushNotificationsAsync();
    expect(result).toBe(false);
  });
});
