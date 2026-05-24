// TODO: 채팅 삭제 기능 미구현
//   - 백엔드 엔드포인트 확인 필요: DELETE /chat/sessions/{id}
//   - chat.ts에 deleteChatSession() 함수 추가 필요
//   - ChatListScreen에 스와이프 삭제 UI 구현 필요 (react-native-gesture-handler Swipeable 또는 커스텀)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ChatSessionPane } from './ChatSessionPane';
import { chatApi } from '../../api';
import type { ChatSession } from '../../api';
import { s } from './_chatShared';

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const MOCK_SESSIONS: ChatSession[] = [
  { session_id: 1, title: '복약 상담', status: 'active', updated_at: '2026-05-24T10:00:00' },
  { session_id: 2, title: '부작용 문의', status: 'active', updated_at: '2026-05-23T15:30:00' },
];

export function ChatListScreen({ navigation }: any) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await chatApi.getChatSessions({ page: 1, size: 20 });
        setSessions(res.items);
      } catch (err: any) {
        console.error('[ChatList] 세션 로드 실패:', err);
        if (__DEV__) {
          // TODO: [BE 대기] GET /chat/sessions 미구현 — 구현 완료 후 mock 제거
          setSessions(MOCK_SESSIONS);
        } else {
          setError('상담 목록을 불러오지 못했어요. 다시 시도해주세요.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startNew = async () => {
    try {
      // TODO: [BE 대기] POST /chat/sessions 미구현 — 구현 완료 후 연결 필요
      const newId = String(Date.now());
      const tempSession: ChatSession = { session_id: Number(newId), title: '새 상담', status: 'active' };
      setSessions(prev => [tempSession, ...prev]);
      if (isDesktop) {
        setSelectedId(newId);
      } else {
        navigation.navigate('ChatSession', { sessionId: newId });
      }
    } catch (err: any) {
      console.error('[ChatList] 세션 생성 실패:', err);
    }
  };

  const openSession = (sessionId: string) => {
    if (isDesktop) {
      setSelectedId(sessionId);
    } else {
      navigation.navigate('ChatSession', { sessionId });
    }
  };

  const filtered = sessions.filter(c =>
    !query || c.title.toLowerCase().includes(query.toLowerCase())
  );

  const searchBar = (
    <View style={s.searchBox}>
      <Icon name="search" size={14} color={colors.muted} />
      <TextInput
        style={{ flex: 1, fontSize: typography.fz14, color: colors.ink, marginLeft: spacing.s8, height: 36 }}
        placeholder="검색"
        value={query}
        onChangeText={setQuery}
      />
    </View>
  );

  const sessionList = (
    <>
      {loading ? (
        <View style={{ alignItems: 'center', padding: 48 }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', padding: 48 }}>
          <Text style={{ fontSize: typography.fz14, color: colors.muted, textAlign: 'center', marginBottom: spacing.s16 }}>{error}</Text>
          <Button variant="ghost" size="sm" onPress={() => {
            setLoading(true);
            setError('');
            chatApi.getChatSessions({ page: 1, size: 20 })
              .then(res => setSessions(res.items))
              .catch(() => setError('상담 목록을 불러오지 못했어요. 다시 시도해주세요.'))
              .finally(() => setLoading(false));
          }}>다시 시도</Button>
        </View>
      ) : sessions.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 48 }}>
          <Icon name="chat" size={36} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink, marginTop: 14, marginBottom: 6 }}>아직 상담 내역이 없어요</Text>
          <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20, textAlign: 'center' }}>복약·생활습관 관련 궁금한 점을 물어보세요.</Text>
          <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>새 상담 시작하기</Button>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: 'center', padding: spacing.s24 }}>검색 결과가 없어요</Text>
      ) : (
        filtered.map(c => {
          const sid = String(c.session_id);
          return (
            <TouchableOpacity
              key={sid}
              style={[s.chatItem, isDesktop && selectedId === sid && ds.chatItemSelected]}
              onPress={() => openSession(sid)}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }} numberOfLines={1}>{c.title}</Text>
                  <Text style={{ fontSize: typography.fz11, color: colors.muted, marginLeft: spacing.s8 }}>{formatTime(c.updated_at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  // ── Desktop: split layout ──────────────────────────────────────────────────
  if (isDesktop) {
    const selectedSession = sessions.find(c => String(c.session_id) === selectedId);

    return (
      <View style={ds.root}>
        <View style={ds.sidebar}>
          <View style={ds.sidebarHeader}>
            <Text style={ds.sidebarTitle}>건강 상담</Text>
            <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>새 상담</Button>
          </View>
          <View style={{ paddingHorizontal: spacing.s8, marginBottom: spacing.s8 }}>
            {searchBar}
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.s8 }}>
            {sessionList}
          </ScrollView>
        </View>

        <View style={ds.pane}>
          {selectedId ? (
            <>
              <View style={ds.paneHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={ds.paneTitle} numberOfLines={1}>{selectedSession?.title ?? '상담'}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedId(null)} style={ds.closeBtn}>
                  <Icon name="x" size={14} color={colors.ink2} />
                </TouchableOpacity>
              </View>
              <ChatSessionPane sessionId={selectedId} />
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.s12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chat" size={28} color={colors.accent700} />
              </View>
              <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}>상담을 선택해주세요</Text>
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>왼쪽에서 상담을 선택하거나 새 상담을 시작하세요.</Text>
              <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>새 상담 시작하기</Button>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── Mobile / Tablet ────────────────────────────────────────────────────────
  return (
    <ScreenLayout
      title="상담 목록"
      right={
        <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>새 상담</Button>
      }
      headerExtra={searchBar}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s8 }}
    >
      {sessionList}
    </ScreenLayout>
  );
}

const ds = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.canvas },
  sidebar: { width: 300, borderRightWidth: 1, borderRightColor: colors.hairline, backgroundColor: colors.surface, paddingTop: spacing.safeTop },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.s16, paddingBottom: spacing.s12 },
  sidebarTitle: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  chatItemSelected: { backgroundColor: colors.accent50, borderColor: colors.accent },
  pane: { flex: 1, backgroundColor: colors.canvas },
  paneHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.safeTop, paddingBottom: 14, paddingHorizontal: spacing.s20, borderBottomWidth: 0.5, borderBottomColor: colors.hairline, backgroundColor: colors.canvas },
  paneTitle: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.s12 },
});

export default ChatListScreen;
