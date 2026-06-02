import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
