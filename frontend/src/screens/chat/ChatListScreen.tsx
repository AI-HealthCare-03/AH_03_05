// TODO: 채팅 삭제 기능 미구현
//   - 백엔드 엔드포인트 확인 필요: DELETE /chat/sessions/{id}
//   - chat.ts에 deleteChatSession() 함수 추가 필요
//   - ChatListScreen에 스와이프 삭제 UI 구현 필요 (react-native-gesture-handler Swipeable 또는 커스텀)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { colors, spacing, typography, radii } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ChatSessionPane } from './ChatSessionPane';
import { chatApi } from '../../api';
import type { ChatSession, ChatMessageItem } from '../../api';
function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const MOCK_SESSIONS: ChatSession[] = [
  { session_id: 1, title: '혈압약 부작용 문의',  last_message: '혈압약 먹는데 사우나 가도 되나요?', status: 'active', updated_at: new Date(Date.now() - 2 * 60 * 60000).toISOString() },
  { session_id: 2, title: '메트포르민과 음주',   last_message: '와인 한 잔 정도는 괜찮을까요?',     status: 'active', updated_at: new Date(Date.now() - 26 * 60 * 60000).toISOString() },
  { session_id: 3, title: '고지혈증 식단',        last_message: '어떤 음식이 좋을까요?',             status: 'active', updated_at: new Date(Date.now() - 25 * 24 * 60 * 60000).toISOString() },
];

export function ChatListScreen({ navigation, route }: any) {
  const { top: safeTop } = useSafeAreaInsets();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [messagesCache, setMessagesCache] = useState<Record<string, ChatMessageItem[]>>({});
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await chatApi.getChatSessions({ page: 1, size: 20 });
        setSessions(res.items);
      } catch (err: any) {
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

  useEffect(() => {
    if (route?.params?.sessionId) {
      navigation.navigate('ChatSession', { sessionId: route.params.sessionId });
    }
  }, [route?.params?.sessionId]);

  const startNew = async () => {
    try {
      // TODO: BE standalone 세션 지원 후 createChatSession() 활성화
      // PR 코멘트 참고: record_id optional 지원 요청 필요
      const newId = String(Date.now());
      const tempSession: ChatSession = { session_id: Number(newId), title: '새 상담', status: 'active' };
      setSessions(prev => [tempSession, ...prev]);
      if (isDesktop) {
        setSelectedId(newId);
      } else {
        navigation.navigate('ChatSession', { sessionId: newId, title: '새 상담' });
      }
    } catch (err: any) {
    }
  };

  const openSession = (c: ChatSession) => {
    if (isDesktop) {
      setSelectedId(String(c.session_id));
    } else {
      navigation.navigate('ChatSession', { sessionId: String(c.session_id), title: c.title, subtitle: c.last_message });
    }
  };

  const handleFirstMessage = (text: string) => {
    const title = text.slice(0, 15);
    setSessions(prev => prev.map(s =>
      String(s.session_id) === selectedId
        ? { ...s, title, last_message: text, updated_at: new Date().toISOString() }
        : s
    ));
  };

  const handleMessageSent = (text: string) => {
    setSessions(prev => prev.map(s =>
      String(s.session_id) === selectedId
        ? { ...s, last_message: text, updated_at: new Date().toISOString() }
        : s
    ));
  };

  const filtered = sessions.filter(c =>
    !query || c.title.toLowerCase().includes(query.toLowerCase())
  );

  const selectedSession = sessions.find(c => String(c.session_id) === selectedId);

  const searchBar = (
    <Card
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s8,
        borderColor: searchFocused ? colors.accent : colors.hairline,
        borderWidth: searchFocused ? 1.5 : 0.5,
        height: 44,
        paddingVertical: 0,
        paddingHorizontal: spacing.s12,
      }}
    >
      <Icon name="search" size={16} color={searchFocused ? colors.accent : colors.muted} />
      <TextInput
        style={{ flex: 1, fontSize: typography.fz14, color: colors.ink, outlineStyle: 'none' } as any}
        placeholder="검색"
        placeholderTextColor={colors.muted2}
        value={query}
        onChangeText={setQuery}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        onKeyPress={({ nativeEvent }: any) => {
          if (nativeEvent.key === 'Enter') setSearchFocused(false);
        }}
      />
    </Card>
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
          const selected = isDesktop && selectedId === sid;
          return (
            <TouchableOpacity
              key={sid}
              style={[ds.sessionRow, selected && { backgroundColor: colors.accent50, borderRadius: radii.lg }]}
              onPress={() => openSession(c)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink, flex: 1 }} numberOfLines={1}>{c.title}</Text>
                <Text style={{ fontSize: typography.fz11, color: colors.muted, marginLeft: spacing.s8 }}>{formatTime(c.updated_at)}</Text>
              </View>
              {c.last_message ? (
                <Text style={{ fontSize: typography.fz11, color: colors.muted, marginTop: 2 }} numberOfLines={1}>{c.last_message}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  // Both panels stay in the tree at all times — visibility toggled via display:none.
  // This prevents ChatSessionPane from remounting on resize (no flicker).
  const showSidebar = isDesktop || !selectedId;
  const showPane = isDesktop || !!selectedId;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.canvas }, isDesktop && { alignItems: 'center' }]}>
      <View style={isDesktop
        ? [ds.root, { paddingTop: Math.max(safeTop + spacing.s8, spacing.safeTop), paddingBottom: Math.max(safeTop + spacing.s8, spacing.safeTop) }]
        : { flex: 1, paddingHorizontal: spacing.s8, paddingTop: Math.max(safeTop, spacing.safeTop), paddingBottom: spacing.s24 }
      }>
        {/* Sidebar — always mounted; hidden on mobile when a session is open */}
        <Card shadow style={[isDesktop ? ds.sidebar : { flex: 1 }, !showSidebar && { display: 'none' as any }]}>
          <View style={ds.sidebarHeader}>
            <Text style={ds.sidebarTitle}>상담 목록</Text>
            <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>새 상담</Button>
          </View>
          <View style={{ paddingHorizontal: spacing.s12, marginBottom: spacing.s8 }}>
            {searchBar}
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.s4 }}>
            {sessionList}
          </ScrollView>
        </Card>

        {/* Pane — always mounted; hidden on mobile when no session is selected */}
        <Card shadow style={[isDesktop ? ds.pane : { flex: 1 }, !showPane && { display: 'none' as any }]}>
          {selectedId ? (
            <>
              <View style={ds.paneHeader}>
                <TouchableOpacity onPress={() => setSelectedId(null)} style={ds.iconBtn}>
                  <Icon name="arrow-left" size={16} color={colors.ink2} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: spacing.s8 }}>
                  <Text style={ds.paneTitle} numberOfLines={1}>{selectedSession?.title ?? '상담'}</Text>
                  {selectedSession?.last_message ? (
                    <Text style={ds.paneSubtitle} numberOfLines={1}>{selectedSession.last_message}</Text>
                  ) : null}
                </View>
              </View>
              <ChatSessionPane
                sessionId={selectedId}
                cachedMessages={messagesCache[selectedId]}
                onMessagesChange={(msgs) => setMessagesCache(prev => ({ ...prev, [selectedId]: msgs }))}
                onFirstMessage={handleFirstMessage}
                onMessageSent={handleMessageSent}
              />
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
        </Card>
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  root:          { flex: 1, flexDirection: 'row', width: '100%', maxWidth: 900, padding: spacing.s16, gap: spacing.s16 },
  sidebar:       { width: 300 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.s16, paddingTop: spacing.s12, paddingBottom: spacing.s12 },
  sidebarTitle:  { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  pane:          { flex: 1 },
  paneHeader:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.s16, borderBottomWidth: 0.5, borderBottomColor: colors.hairline },
  paneTitle:     { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  paneSubtitle:  { fontSize: typography.fz12, color: colors.muted, marginTop: 2 },
  iconBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sessionRow:    { paddingVertical: spacing.s12, paddingHorizontal: spacing.s16 },
});

export default ChatListScreen;
