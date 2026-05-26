import React from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

type Notification = {
  id: string | number;
  icon: string;
  title: string;
  time: string;
  body: string;
  unread: boolean;
};

type NotificationRowProps = {
  item: Notification;
  isFirst: boolean;
};

function NotificationRow({ item: n, isFirst }: NotificationRowProps) {
  return (
    <View style={[s.notifRow, !isFirst && { borderTopWidth: 0.5, borderTopColor: colors.hairline }, n.unread && { backgroundColor: colors.accent50 }]}>
      <View style={s.notifIcon}><Icon name={n.icon} size={14} color={colors.accent700} /></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.s8 }}>
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, flex: 1 }} numberOfLines={1}>{n.title}</Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{n.time}</Text>
        </View>
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s4 }}>{n.body}</Text>
      </View>
      {n.unread && <View style={{ width: 7, height: 7, borderRadius: radii.pill, backgroundColor: colors.danger, marginTop: spacing.s4, marginLeft: 6 }} />}
    </View>
  );
}

export function NotificationsScreen({ navigation }: any) {
  // TODO: [BE 대기] GET /notifications 백엔드 미구현 — 구현 완료 후 AppContext 목업 대신 API 응답으로 교체 필요
  const { notifications, setNotifications, flash } = useApp();
  // TODO: [BE 대기] PATCH /notifications/read-all 백엔드 미구현 — 구현 완료 후 연결 필요
  const markAll = () => { setNotifications(notifications.map(n => ({ ...n, unread: false }))); flash('모두 읽음 처리했어요'); };
  // TODO: [BE 대기] DELETE /notifications 백엔드 미구현 — 구현 완료 후 연결 필요
  const clear   = () => { setNotifications([]); flash('알림을 모두 지웠어요'); };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isToday = (n: { date: string }) => new Date(n.date) >= todayStart;
  const today   = notifications.filter(isToday);
  const earlier = notifications.filter(n => !isToday(n));

  const right = (
    <View style={{ flexDirection: 'row', gap: spacing.s8 }}>
      <Button variant="ghost" size="sm" onPress={markAll}>모두 읽음</Button>
      <Button variant="ghost" size="sm" onPress={clear}>모두 지우기</Button>
    </View>
  );

  if (notifications.length === 0) {
    return (
      <ScreenLayout title="알림" back onBack={() => navigation.goBack()} right={right} scrollable>
        <Card shadow style={{ alignItems: 'center', paddingVertical: spacing.s56 }}>
          <Icon name="bell" size={36} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, marginTop: 14 }}>알림이 없어요</Text>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="알림" back onBack={() => navigation.goBack()} right={right} scrollable>
      {[{ label: '오늘', items: today }, { label: '이전', items: earlier }].map(g =>
        g.items.length > 0 ? (
          <View key={g.label} style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.muted, paddingHorizontal: spacing.s4, marginBottom: spacing.s8 }}>{g.label}</Text>
            <Card shadow noPadding style={{ overflow: 'hidden' }}>
              {g.items.map((n, i) => (
                <NotificationRow key={n.id} item={n} isFirst={i === 0} />
              ))}
            </Card>
          </View>
        ) : null
      )}
    </ScreenLayout>
  );
}

export default NotificationsScreen;
