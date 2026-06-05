import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useApp } from '../../context/AppContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'MedicationAlarm'>;
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import { formatTimePeriod } from '../../utils/date';

const ICON_CIRCLE_SIZE = 140;
const SNOOZE_CIRCLE_SIZE = 80;

type MealKey = 'morning' | 'lunch' | 'dinner';

const MEAL_LABELS: Record<MealKey, string> = {
  morning: '아침 복약',
  lunch: '점심 복약',
  dinner: '저녁 복약',
};

const MEAL_BODY: Record<MealKey, string> = {
  morning: '아침 복약 시간입니다',
  lunch: '점심 복약 시간입니다',
  dinner: '저녁 복약 시간입니다',
};

export function MedicationAlarmScreen({ navigation, route }: Props) {
  const meal: MealKey = route?.params?.meal ?? 'morning';
  const { notifSettings, drugs } = useApp();
  const insets = useSafeAreaInsets();
  const [snoozing, setSnoozing] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const mealState = notifSettings[meal];
  const timeDisplay = formatTimePeriod(mealState.time);

  const MEAL_KEYWORD: Record<MealKey, string> = {
    morning: '아침',
    lunch: '점심',
    dinner: '저녁',
  };
  const drugNames = drugs
    .filter(d => d.time.includes(MEAL_KEYWORD[meal]))
    .map(d => d.name);

  const handleComplete = () => {
    // checkin 엔드포인트(POST /medication-checkins)는 Sprint 3 구현 예정
    setDone(true);
    dismiss();
  };

  const snooze = async (minutes: number) => {
    setSnoozing(minutes);
    if (Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '복약 알림',
            body: MEAL_BODY[meal],
            data: { type: 'medication', meal },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: minutes * 60,
          },
        });
      } catch {}
    }
    dismiss();
  };

  const dismiss = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main');
  };

  return (
    <View style={[s.root, { paddingTop: spacing.safeTop }]}>
      <View style={s.center}>
        <View style={s.iconCircle}>
          <Icon name="pill" size={56} color={colors.accent} />
        </View>
        <Text style={[s.timeText, { marginBottom: spacing.s12 }]}>{timeDisplay}</Text>
        <Text style={s.mealLabel}>{MEAL_LABELS[meal]}</Text>
        {drugNames.length > 0 && <Text style={s.drugNames}>{drugNames.join(' · ')}</Text>}
      </View>

      <View style={[s.actions, { bottom: insets.bottom + spacing.s24 }]}>
        <TouchableOpacity
          style={[s.completeBtn, (snoozing !== null || done) && s.dimmed]}
          onPress={handleComplete}
          disabled={snoozing !== null || done}
          activeOpacity={0.75}
        >
          <Text style={s.completeBtnText}>{done ? '복약 완료됨 ✓' : '복약 완료'}</Text>
        </TouchableOpacity>
        <Text style={s.snoozeHint}>스누즈</Text>
        <View style={s.snoozeRow}>
          {([5, 10] as const).map(min => (
            <TouchableOpacity
              key={min}
              style={[s.snoozeCircle, (snoozing !== null || done) && s.dimmed]}
              onPress={() => snooze(min)}
              disabled={snoozing !== null || done}
              activeOpacity={0.75}
            >
              {snoozing === min ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <>
                  <Icon name="clock" size={24} color={colors.accent700} />
                  <Text style={s.snoozeLabel}>{min}분</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.dismissBtn, (snoozing !== null || done) && s.dimmed]}
          onPress={dismiss}
          disabled={snoozing !== null || done}
          activeOpacity={0.6}
        >
          <Text style={s.dismissText}>중지</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default MedicationAlarmScreen;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.s32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.s48,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: colors.accent100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s32,
  },
  timeText: {
    fontSize: typography.fz48,
    fontWeight: typography.fw7,
    color: colors.ink,
    letterSpacing: -1,
  },
  mealLabel: {
    fontSize: typography.fz17,
    fontWeight: typography.fw5,
    color: colors.ink2,
  },
  actions: {
    position: 'absolute',
    left: spacing.s32,
    right: spacing.s32,
    alignItems: 'center',
    gap: spacing.s16,
  },
  snoozeHint: {
    fontSize: typography.fz13,
    color: colors.muted,
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: spacing.s24,
  },
  snoozeCircle: {
    width: SNOOZE_CIRCLE_SIZE,
    height: SNOOZE_CIRCLE_SIZE,
    borderRadius: SNOOZE_CIRCLE_SIZE / 2,
    backgroundColor: colors.accent50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s4,
  },
  snoozeLabel: {
    fontSize: typography.fz12,
    color: colors.accent700,
    fontWeight: typography.fw6,
  },
  dismissBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.s16,
  },
  dismissText: {
    fontSize: typography.fz16,
    color: colors.muted,
    fontWeight: typography.fw5,
  },
  dimmed: {
    opacity: 0.45,
  },
  completeBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.s16,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
  },
  completeBtnText: {
    fontSize: typography.fz16,
    fontWeight: typography.fw6,
    color: colors.white,
  },
  drugNames: {
    fontSize: typography.fz13,
    color: colors.muted,
    marginTop: spacing.s8,
    textAlign: 'center',
  },
});
