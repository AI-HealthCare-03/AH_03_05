import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Modal,
  Platform,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useApp, type Notification } from '../context/AppContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { colors, radii, shadows, spacing, typography } from '../theme';
import Icon from './Icon';
import Card from './Card';
import Button from './Button';
import { notificationsApi } from '../api';
import Toast from './Toast';

const DRAWER_WIDTH = 460;

export default function NotificationDrawer() {
  const {
    notifDrawerOpen,
    setNotifDrawerOpen,
    notifications,
    setNotifications,
    flash,
    markNotificationRead,
  } = useApp();
  const { isDesktopOrAbove } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [rendered, setRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notifDrawerOpen) return;
    notificationsApi
      .getNotifications()
      .then(res => {
        const mapped: Notification[] = res.items.map(item => {
          const d = item.created_at ? new Date(item.created_at) : new Date();
          const hh = d.getHours();
          const mm = String(d.getMinutes()).padStart(2, '0');
          return {
            id: String(item.notification_id),
            type: 'info' as const,
            title: item.title,
            body: item.message ?? '',
            date: d.toISOString(),
            time: `${hh}:${mm}`,
            icon: 'bell',
            unread: !item.is_read,
          };
        });
        if (mapped.length > 0) setNotifications(mapped);
      })
      .catch(() => {});
  }, [notifDrawerOpen]);

  useEffect(() => {
    if (notifDrawerOpen) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 13,
        }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [notifDrawerOpen]);

  const close = () => setNotifDrawerOpen(false);

  const handlePress = (n: Notification) => {
    const id = n.id;
    if (id != null && !Number.isNaN(Number(id))) {
      markNotificationRead(id);
      notificationsApi.markNotificationRead(Number(id)).catch(() => {});
    }
    close();
    switch (n.type) {
      case 'medication':
        navigation.navigate('HomeTab');
        break;
      case 'record':
        if (n.target_id) {
          navigation.navigate('RecordsTab', {
            screen: 'RecordDetail',
            params: { recordId: Number(n.target_id) },
          });
        }
        break;
      case 'guide':
        navigation.navigate('HomeTab', {
          screen: 'GuideResult',
          params: { guideId: n.target_id ? Number(n.target_id) : undefined },
        });
        break;
      case 'chat':
        if (n.target_id) {
          navigation.navigate('ChatTab', {
            screen: 'ChatSession',
            params: { chatId: n.target_id },
          });
        }
        break;
    }
  };

  const markAll = () => {
    notificationsApi.markAllNotificationsRead().catch(() => {});
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    flash('모두 읽음 처리했어요');
  };

  const handleDelete = (id: string) => {
    const numId = Number(id);
    if (!Number.isNaN(numId)) {
      notificationsApi.deleteNotification(numId).catch(() => {});
    }
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clear = () => {
    notifications.forEach(n => {
      const numId = Number(n.id);
      if (!Number.isNaN(numId)) {
        notificationsApi.deleteNotification(numId).catch(() => {});
      }
    });
    setNotifications([]);
    flash('알림을 모두 지웠어요');
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isToday = (n: { date: string }) => new Date(n.date) >= todayStart;
  const todayNotifs = notifications.filter(isToday);
  const earlierNotifs = notifications.filter(n => !isToday(n));

  if (!rendered) return null;

  return (
    <Modal transparent visible={rendered} animationType="none" onRequestClose={close}>
      <View style={s.overlay} pointerEvents="box-none">
        <Toast />
        {/* 스크림 */}
        <Animated.View
          style={[s.scrim, { opacity: fadeAnim }]}
          pointerEvents={notifDrawerOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={close} activeOpacity={1} accessibilityRole="button" accessibilityLabel="알림 닫기" />
        </Animated.View>

        {/* 드로워 패널 */}
        <Animated.View
          style={[
            s.panel,
            panelShadow,
            isDesktopOrAbove ? s.panelDesktop : s.panelMobile,
            isDesktopOrAbove && { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* 헤더 */}
          <View style={[s.header, { paddingTop: insets.top + spacing.s16 }]}>
            <Text style={s.title}>알림</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8 }}>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onPress={markAll}>
                  모두 읽음
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onPress={clear}>
                  모두 지우기
                </Button>
              )}
              <TouchableOpacity onPress={close} style={s.closeBtn} accessibilityLabel="닫기">
                <Icon name="x" size={15} color={colors.ink2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 알림 목록 */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.s16, gap: spacing.s16 }}
          >
            {notifications.length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: spacing.s56 }}>
                <Icon name="bell" size={36} color={colors.muted2} />
                <Text
                  style={{
                    fontSize: typography.fz15,
                    fontWeight: typography.fw6,
                    marginTop: spacing.s14,
                  }}
                >
                  알림이 없어요
                </Text>
              </Card>
            ) : (
              [
                { label: '오늘', items: todayNotifs },
                { label: '이전', items: earlierNotifs },
              ].map(g =>
                g.items.length > 0 ? (
                  <View key={g.label}>
                    <Text style={s.groupLabel}>{g.label}</Text>
                    <Card noPadding style={{ overflow: 'hidden' }}>
                      {g.items.map((n, i) => {
                        const rowStyle = [
                          s.notifRow,
                          i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
                          n.unread && { backgroundColor: colors.accent50 },
                        ];
                        const rowContent = (
                          <View style={rowStyle}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handlePress(n)}
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                gap: spacing.s12,
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={n.title}
                            >
                              <View style={s.notifIcon}>
                                <Icon name={n.icon} size={14} color={colors.accent700} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}
                                  numberOfLines={1}
                                >
                                  {n.title}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: typography.fz13,
                                    color: colors.muted,
                                    marginTop: spacing.s4,
                                  }}
                                >
                                  {n.body}
                                </Text>
                              </View>
                              {n.unread && <View style={s.unreadDot} />}
                            </TouchableOpacity>
                            <View style={s.notifRight}>
                              {Platform.OS === 'web' && (
                                <TouchableOpacity
                                  onPress={() => handleDelete(n.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  style={s.deleteBtn}
                                  accessibilityLabel="알림 삭제"
                                >
                                  <Icon name="x" size={12} color={colors.muted2} />
                                </TouchableOpacity>
                              )}
                              <Text style={s.notifTime}>{n.time}</Text>
                            </View>
                          </View>
                        );

                        if (Platform.OS !== 'web') {
                          return (
                            <Swipeable
                              key={n.id}
                              friction={2}
                              rightThreshold={60}
                              overshootLeft={false}
                              renderRightActions={() => (
                                <TouchableOpacity
                                  style={s.swipeDelete}
                                  onPress={() => handleDelete(n.id)}
                                >
                                  <Text style={s.swipeDeleteText}>삭제</Text>
                                </TouchableOpacity>
                              )}
                            >
                              {rowContent}
                            </Swipeable>
                          );
                        }
                        return React.cloneElement(rowContent, { key: n.id });
                      })}
                    </Card>
                  </View>
                ) : null
              )
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const panelShadow = shadows.drawer;

const s = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    backgroundColor: colors.surface,
  },
  panelDesktop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
  },
  panelMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.s16,
    paddingBottom: spacing.s16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  title: {
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    color: colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLabel: {
    fontSize: typography.fz12,
    color: colors.muted,
    paddingHorizontal: spacing.s4,
    marginBottom: spacing.s8,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: spacing.s16,
    gap: spacing.s12,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.accent100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    marginTop: spacing.s4,
    marginLeft: spacing.s6,
  },
  notifRight: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: spacing.s2,
    gap: spacing.s12,
  },
  notifTime: {
    fontSize: typography.fz12,
    color: colors.muted,
  },
  deleteBtn: {},
  swipeDelete: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.s20,
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: typography.fz13,
    fontWeight: typography.fw6,
  },
});
