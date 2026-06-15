import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { usersApi } from '../api';
import type { NotifSettings } from '../context/AppContext';

type MealKey = 'morning' | 'lunch' | 'dinner';

const MEAL_BODY: Record<MealKey, string> = {
  morning: '아침 복약 시간입니다',
  lunch: '점심 복약 시간입니다',
  dinner: '저녁 복약 시간입니다',
};

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: isNaN(h) ? 8 : h, minute: isNaN(m) ? 0 : m };
}

export async function scheduleMedicationNotifications(settings: NotifSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.master) return;

  const meals: [MealKey, { on: boolean; time: string }][] = [
    ['morning', settings.morning],
    ['lunch', settings.lunch],
    ['dinner', settings.dinner],
  ];

  for (const [key, state] of meals) {
    if (!state.on) continue;
    const { hour, minute } = parseTime(state.time);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '복약 알림',
        body: MEAL_BODY[key],
        data: { type: 'medication', meal: key },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

// 네이티브 실기기에서 원시 디바이스 푸시 토큰(Android=FCM, iOS=APNs)을 받아
// 백엔드에 등록한다. BE가 firebase_admin messaging.send(token=...)로 발송하므로
// Expo 푸시 토큰이 아닌 getDevicePushToken() 원시 토큰을 보낸다.
// 실패해도 앱 흐름을 막지 않도록 조용히 처리한다.
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false; // 시뮬레이터/에뮬레이터는 푸시 토큰 발급 불가

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let granted = existing === 'granted';
    if (!granted) {
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === 'granted';
    }
    if (!granted) return false;

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) return false;

    await usersApi.registerFcmToken(token);
    return true;
  } catch {
    return false;
  }
}
