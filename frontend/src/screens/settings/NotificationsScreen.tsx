import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useApp, type Notification } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';
import { notificationsApi } from '../../api';
import EmptyState from '../../components/EmptyState';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParams, RootStackParams } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'Notifications'>;

type NotificationRowProps = {
  item: Notification;
  isFirst: boolean;
  onPress: () => void;
};

function NotificationRow({ item: n, isFirst, onPress }: NotificationRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.notifRow,
        !isFirst && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
        n.unread && { backgroundColor: colors.accent50 },
      ]}
    >
      <View style={s.notifIcon}>
        <Icon name={n.icon} size={14} color={colors.accent700} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.s8,
          }}
        >
          <Text
            style={{ fontSize: typography.fz14, fontWeight: typography.fw6, flex: 1 }}
            numberOfLines={1}
          >
            {n.title}
          </Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{n.time}</Text>
        </View>
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s4 }}>
          {n.body}
        </Text>
      </View>
      {n.unread && (
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: radii.pill,
            backgroundColor: colors.danger,
            marginTop: spacing.s4,
            marginLeft: spacing.s6,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

function mapNotifType(t: string): Notification['type'] {
  if (t.includes('medication') || t.includes('alarm')) return 'medication';
  if (t.includes('record') || t.includes('prescription')) return 'record';
  if (t.includes('guide')) return 'guide';
  if (t.includes('chat')) return 'chat';
  return 'info';
}

function mapNotifIcon(t: string): string {
  if (t.includes('medication') || t.includes('alarm')) return 'pill';
  if (t.includes('record') || t.includes('prescription')) return 'doc';
  if (t.includes('guide')) return 'wand';
  if (t.includes('chat')) return 'chat';
  return 'bell';
}

export function NotificationsScreen({ navigation }: { navigation: NavProp }) {
  const { notifications, setNotifications, flash, markNotificationRead } = useApp();
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    notificationsApi
      .getNotifications()
      .then(res => {
        const mapped: Notification[] = res.items.map(item => {
          const d = item.created_at ? new Date(item.created_at) : new Date();
          const hh = d.getHours();
          const mm = String(d.getMinutes()).padStart(2, '0');
          return {
            id: String(item.notification_id),
            type: mapNotifType(item.notification_type),
            title: item.title,
            body: item.message,
            date: d.toISOString(),
            time: `${hh}:${mm}`,
            icon: mapNotifIcon(item.notification_type),
            unread: !item.is_read,
          };
        });
        setNotifications(mapped);
        setLoadError('');
      })
      .catch(() => setLoadError('알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'));
  }, []);

  const handleNotifPress = (n: Notification) => {
    const id = n.id;
    if (id != null && !Number.isNaN(Number(id))) {
      markNotificationRead(id);
      notificationsApi
        .markNotificationRead(Number(id))
        .catch(() => flash('읽음 처리에 실패했어요'));
    }
    if (n.type === 'medication') {
      (navigation as unknown as NativeStackNavigationProp<RootStackParams>).navigate(
        'MedicationAlarm',
        {}
      );
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      flash('모두 읽음 처리했어요');
    } catch {
      flash('읽음 처리에 실패했어요. 다시 시도해주세요.');
    }
  };

  const clear = async () => {
    const prev = notifications;
    setNotifications([]);
    try {
      await Promise.all(
        prev
          .filter(n => !Number.isNaN(Number(n.id)))
          .map(n => notificationsApi.deleteNotification(Number(n.id)))
      );
      flash('알림을 모두 지웠어요');
    } catch {
      setNotifications(prev);
      flash('알림 삭제에 실패했어요. 다시 시도해주세요.');
    }
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isToday = (n: { date: string }) => new Date(n.date) >= todayStart;
  const today = notifications.filter(isToday);
  const earlier = notifications.filter(n => !isToday(n));

  const right =
    notifications.length > 0 ? (
      <View style={{ flexDirection: 'row', gap: spacing.s8 }}>
        <Button variant="ghost" size="sm" onPress={markAll}>
          모두 읽음
        </Button>
        <Button variant="ghost" size="sm" onPress={clear}>
          모두 지우기
        </Button>
      </View>
    ) : null;

  const errorBanner = loadError ? (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s8,
        backgroundColor: colors.danger50,
        borderRadius: radii.sm,
        padding: spacing.s12,
        marginBottom: spacing.s14,
      }}
    >
      <Icon name="alert" size={14} color={colors.danger} />
      <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>{loadError}</Text>
    </View>
  ) : null;

  if (notifications.length === 0) {
    return (
      <ScreenLayout title="알림" back onBack={() => navigation.goBack()} right={right} scrollable>
        {errorBanner}
        <Card shadow>
          <EmptyState icon="bell" title="알림이 없어요" />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="알림" back onBack={() => navigation.goBack()} right={right} scrollable>
      {errorBanner}
      {[
        { label: '오늘', items: today },
        { label: '이전', items: earlier },
      ].map(g =>
        g.items.length > 0 ? (
          <View key={g.label} style={{ marginBottom: spacing.s18 }}>
            <Text
              style={{
                fontSize: typography.fz12,
                color: colors.muted,
                paddingHorizontal: spacing.s4,
                marginBottom: spacing.s8,
              }}
            >
              {g.label}
            </Text>
            <Card shadow noPadding style={{ overflow: 'hidden' }}>
              {g.items.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  item={n}
                  isFirst={i === 0}
                  onPress={() => handleNotifPress(n)}
                />
              ))}
            </Card>
          </View>
        ) : null
      )}
    </ScreenLayout>
  );
}

export default NotificationsScreen;
