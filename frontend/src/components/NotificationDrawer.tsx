// src/components/NotificationDrawer.tsx
import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import { colors, spacing, radii } from '../theme';

type NotifCategory = '복약' | '가이드' | '상담' | '안내';
type NotifItem = {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  destination?: { tab: string; screen?: string; params?: object };
};
type NotifState = { id: string; unread: boolean };

const MOCK: NotifItem[] = [
  { id: '1', category: '복약',   title: '저녁 복약 시간이에요',          body: '로수바스타틴 10mg · 19:00 식후 30분', time: '방금 전',        unread: true,
    destination: { tab: 'HomeTab', screen: 'Home' } },
  { id: '2', category: '가이드', title: '새 복약 가이드가 생성됐어요',    body: '처방전 #4 분석 결과를 확인해보세요.',  time: '1시간 전',       unread: true,
    destination: { tab: 'GuideTab', screen: 'GuideResult' } },
  { id: '3', category: '상담',   title: '상담 답변이 도착했어요',         body: '혈압약 복용 중 사우나 이용에 대한 답변', time: '오늘 오전 9:12', unread: false,
    destination: { tab: 'ChatTab', screen: 'ChatList' } },
  { id: '4', category: '안내',   title: '내 정보를 업데이트해 주세요',    body: '마지막 수정 후 90일이 지났어요.',       time: '어제',           unread: false,
    destination: { tab: 'SettingsTab', screen: 'ProfileEdit' } },
  { id: '5', category: '복약',   title: '어제 복약을 빠뜨리셨어요',       body: '메트포르민 500mg · 점심 식후',          time: '어제',           unread: false,
    destination: { tab: 'HomeTab', screen: 'Home' } },
];

const CAT: Record<NotifCategory, { color: string; bg: string; icon: string }> = {
  복약:   { color: colors.accent,  bg: colors.accent50,  icon: 'pill' },
  가이드: { color: colors.success, bg: colors.success50, icon: 'doc' },
  상담:   { color: colors.muted,   bg: colors.surface2,  icon: 'chat' },
  안내:   { color: colors.warning, bg: colors.warning50, icon: 'info' },
};

// clearAll 여부를 판별하는 sentinel: { id: '__cleared__', unread: false }
const CLEARED_SENTINEL = '__cleared__';

export default function NotificationDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigation = useNavigation<any>();
  const { notifications, setNotifications } = useApp();

  // 최초: AppContext가 비어있으면 MOCK unread 상태로 초기화 → 벨 뱃지 연동
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setNotifications?.(MOCK.map(n => ({ id: n.id, unread: n.unread })));
    }
  }, []);

  // clearAll sentinel 여부 확인
  const isCleared = (notifications || []).some((n: NotifState) => n.id === CLEARED_SENTINEL);

  // AppContext의 unread 상태를 MOCK에 merge
  const ctxMap = new Map<string, boolean>(
    (notifications || [])
      .filter((n: NotifState) => n.id !== CLEARED_SENTINEL)
      .map((n: NotifState) => [n.id, n.unread])
  );
  const mergedItems: NotifItem[] = MOCK.map(n =>
    ctxMap.has(n.id) ? { ...n, unread: ctxMap.get(n.id)! } : n
  );

  const displayItems = isCleared ? [] : mergedItems;
  const unreadCount = displayItems.filter(n => n.unread).length;

  const syncCtx = (updated: NotifItem[]) => {
    setNotifications?.(updated.map(n => ({ id: n.id, unread: n.unread })));
  };

  const navigate = (item: NotifItem) => {
    const updated = mergedItems.map(n => n.id === item.id ? { ...n, unread: false } : n);
    syncCtx(updated);
    if (!item.destination) { onClose(); return; }
    onClose();
    const { tab, screen, params } = item.destination;
    setTimeout(() => {
      navigation.navigate('Main', {
        screen: tab,
        ...(screen && { params: { screen, ...(params && { params }) } }),
      });
    }, 150);
  };

  const markAllRead = () => {
    syncCtx(mergedItems.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    // sentinel로 "지워진 상태" 표시 → 벨 뱃지도 0
    setNotifications?.([{ id: CLEARED_SENTINEL, unread: false }]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <View style={s.panel}>
          {/* 헤더 */}
          <View style={s.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="bell" size={17} color={colors.ink} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>알림</Text>
              {unreadCount > 0 && (
                <View style={s.badge}><Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{unreadCount}</Text></View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity style={s.iconBtn} onPress={() => { onClose(); setTimeout(() => navigation.navigate('Main', { screen: 'SettingsTab', params: { screen: 'NotificationSettings' } }), 200); }}>
                <Icon name="settings" size={15} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={onClose}>
                <Icon name="x" size={15} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 서브헤더 */}
          <View style={s.subHeader}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {unreadCount > 0 ? `안 읽은 알림 ${unreadCount}건` : '모두 읽었어요'}
            </Text>
            <TouchableOpacity onPress={markAllRead}>
              <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>✓ 모두 읽음</Text>
            </TouchableOpacity>
          </View>

          {/* 목록 */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {displayItems.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 48 }}>
                <Icon name="bell" size={28} color={colors.muted2} />
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 10 }}>새 알림이 없어요</Text>
              </View>
            ) : displayItems.map((item) => {
              const cfg = CAT[item.category];
              return (
                <TouchableOpacity key={item.id} style={[s.item, item.unread && s.itemUnread]}
                  activeOpacity={0.7}
                  onPress={() => navigate(item)}>
                  <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: item.unread ? cfg.color : 'transparent', borderRadius: 2 }} />
                  <View style={[s.itemIcon, { backgroundColor: cfg.bg }]}>
                    <Icon name={cfg.icon} size={13} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <View style={[s.catBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={{ fontSize: 10, color: cfg.color, fontWeight: '700' }}>{item.category}</Text>
                      </View>
                      {item.unread && <View style={s.dot} />}
                      <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 'auto' as any }}>{item.time}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: item.unread ? '700' : '600', color: colors.ink, marginBottom: 2 }}>{item.title}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 16 }} numberOfLines={2}>{item.body}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 푸터 */}
          {displayItems.length > 0 && (
            <TouchableOpacity style={s.footer} onPress={clearAll}>
              <Icon name="trash" size={13} color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 5 }}>모두 지우기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.4)' },
  panel: {
    width: '38%', maxWidth: 420, minWidth: 300,
    backgroundColor: colors.surface,
    shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 24,
    shadowOffset: { width: -4, height: 0 }, elevation: 12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 0.5, borderBottomColor: colors.hairline,
  },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  iconBtn: { width: 28, height: 28, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  subHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.s4, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: colors.hairline, backgroundColor: colors.canvas,
  },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 12, paddingRight: spacing.s4,
    borderBottomWidth: 0.5, borderBottomColor: colors.hairline,
  },
  itemUnread: { backgroundColor: '#f0f9ff' },
  itemIcon: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: radii.pill },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.danger },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderTopWidth: 0.5, borderTopColor: colors.hairline },
});
