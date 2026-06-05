import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { colors, spacing, typography, radii } from '../../theme';
import IconCircle from '../../components/IconCircle';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ChatSessionPane } from './ChatSessionPane';
import { chatApi, extractApiError } from '../../api';
import type { ChatSession, ChatMessageItem } from '../../api';
import EmptyState from '../../components/EmptyState';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParams } from '../../navigation/types';
import { formatRelativeTime } from '../../utils/date';

type Props = NativeStackScreenProps<ChatStackParams, 'ChatList'>;

export function ChatListScreen({ navigation, route }: Props) {
  const { top: safeTop } = useSafeAreaInsets();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messagesCache, setMessagesCache] = useState<Record<string, ChatMessageItem[]>>({});
  const { isDesktop, isTabletOrAbove } = useBreakpoint();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await chatApi.getChatSessions({ limit: 20, offset: 0 });
        setSessions(res.items);
      } catch (err: any) {
        setError('상담 목록을 불러오지 못했어요. 다시 시도해주세요.');
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

  const startNew = useCallback(async () => {
    try {
      const session = await chatApi.createChatSession({ title: '새 상담' });
      setSessions(prev => [session, ...prev]);
      const sid = String(session.session_id);
      if (isDesktop) {
        setSelectedId(sid);
      } else {
        navigation.navigate('ChatSession', { sessionId: sid, title: session.title });
      }
    } catch (err: any) {
      setError('새 상담을 시작하지 못했어요. 다시 시도해주세요.');
    }
  }, [isDesktop, navigation]);

  const openSession = (c: ChatSession) => {
    if (isDesktop) {
      setSelectedId(String(c.session_id));
    } else {
      navigation.navigate('ChatSession', {
        sessionId: String(c.session_id),
        title: c.title,
        subtitle: c.last_message_preview,
      });
    }
  };

  const handleDelete = (sessionId: number) => {
    const doDelete = async () => {
      let snapshot: ChatSession[] = [];
      setSessions(prev => {
        snapshot = prev;
        return prev.filter(s => s.session_id !== sessionId);
      });
      if (selectedId === String(sessionId)) setSelectedId(null);
      try {
        await chatApi.deleteChatSession(sessionId);
      } catch (e) {
        setSessions(snapshot);
        setError(extractApiError(e));
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('이 상담을 삭제하시겠어요?')) doDelete();
      return;
    }

    Alert.alert('상담 삭제', '이 상담을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: doDelete },
    ]);
  };

  const handleFirstMessage = (text: string) => {
    const title = text.slice(0, 15);
    setSessions(prev =>
      prev.map(s =>
        String(s.session_id) === selectedId
          ? { ...s, title, last_message_preview: text, updated_at: new Date().toISOString() }
          : s
      )
    );
  };

  const handleMessageSent = (text: string) => {
    setSessions(prev =>
      prev.map(s =>
        String(s.session_id) === selectedId
          ? { ...s, last_message_preview: text, updated_at: new Date().toISOString() }
          : s
      )
    );
  };

  const filtered = sessions.filter(
    c => !query || c.title.toLowerCase().includes(query.toLowerCase())
  );

  const selectedSession = sessions.find(c => String(c.session_id) === selectedId);

  const searchBar = <SearchBar value={query} onChangeText={setQuery} />;

  const sessionList = (
    <>
      {loading ? (
        <View style={{ alignItems: 'center', padding: spacing.s48 }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', padding: spacing.s48 }}>
          <Text
            style={{
              fontSize: typography.fz14,
              color: colors.muted,
              textAlign: 'center',
              marginBottom: spacing.s16,
            }}
          >
            {error}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setLoading(true);
              setError('');
              chatApi
                .getChatSessions({ limit: 20, offset: 0 })
                .then(res => setSessions(res.items))
                .catch(() => setError('상담 목록을 불러오지 못했어요. 다시 시도해주세요.'))
                .finally(() => setLoading(false));
            }}
          >
            다시 시도
          </Button>
        </View>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="chat"
          title="아직 상담 내역이 없어요"
          message="복약·생활습관 관련 궁금한 점을 물어보세요."
          action={{ label: '새 상담 시작하기', onPress: startNew }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search" message="검색 결과가 없어요." />
      ) : (
        filtered.map(c => {
          const sid = String(c.session_id);
          const selected = isDesktop && selectedId === sid;
          return (
            <SessionRow
              key={sid}
              session={c}
              selected={selected}
              isDesktop={isDesktop}
              isTablet={isTabletOrAbove && !isDesktop}
              onPress={() => openSession(c)}
              onDelete={() => handleDelete(c.session_id)}
            />
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
    <View
      style={[{ flex: 1, backgroundColor: colors.canvas }, isDesktop && { alignItems: 'center' }]}
    >
      <View
        style={
          isDesktop
            ? [
                ds.root,
                {
                  paddingTop: Math.max(safeTop + spacing.s8, spacing.safeTop),
                  paddingBottom: Math.max(safeTop + spacing.s8, spacing.safeTop),
                },
              ]
            : {
                flex: 1,
                paddingHorizontal: spacing.s8,
                paddingTop: Math.max(safeTop, spacing.safeTop),
                paddingBottom: spacing.s24,
              }
        }
      >
        {/* Sidebar — always mounted; hidden on mobile when a session is open */}
        <Card
          shadow
          style={[isDesktop ? ds.sidebar : { flex: 1 }, !showSidebar && { display: 'none' as any }]}
        >
          <View style={ds.sidebarHeader}>
            <Text style={ds.sidebarTitle}>상담 목록</Text>
            <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>
              새 상담
            </Button>
          </View>
          <View style={{ paddingHorizontal: spacing.s16, marginBottom: spacing.s8 }}>
            {searchBar}
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.s4 }}>
            {sessionList}
          </ScrollView>
        </Card>

        {/* Pane — always mounted; hidden on mobile when no session is selected */}
        <Card
          shadow
          style={[isDesktop ? ds.pane : { flex: 1 }, !showPane && { display: 'none' as any }]}
        >
          {selectedId ? (
            <>
              <View style={ds.paneHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedId(null)}
                  style={ds.iconBtn}
                  accessibilityLabel="뒤로"
                >
                  <Icon name="arrow-left" size={16} color={colors.ink2} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: spacing.s8 }}>
                  <Text style={ds.paneTitle} numberOfLines={1}>
                    {selectedSession?.title ?? '상담'}
                  </Text>
                  {selectedSession?.last_message_preview ? (
                    <Text style={ds.paneSubtitle} numberOfLines={1}>
                      {selectedSession.last_message_preview}
                    </Text>
                  ) : null}
                </View>
              </View>
              <ChatSessionPane
                sessionId={selectedId}
                cachedMessages={messagesCache[selectedId]}
                onMessagesChange={msgs =>
                  setMessagesCache(prev => ({ ...prev, [selectedId]: msgs }))
                }
                onFirstMessage={handleFirstMessage}
                onMessageSent={handleMessageSent}
              />
            </>
          ) : (
            <View
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.s12 }}
            >
              <IconCircle
                size={64}
                icon="chat"
                iconSize={28}
                color={colors.accent700}
                backgroundColor={colors.accent50}
              />
              <Text
                style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}
              >
                상담을 선택해주세요
              </Text>
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>
                왼쪽에서 상담을 선택하거나 새 상담을 시작하세요.
              </Text>
              <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>
                새 상담 시작하기
              </Button>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    maxWidth: 900,
    padding: spacing.s16,
    gap: spacing.s16,
  },
  sidebar: { width: 300 },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s12,
  },
  sidebarTitle: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  pane: { flex: 1 },
  paneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  paneTitle: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  paneSubtitle: { fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sessionRow: { paddingVertical: spacing.s12, paddingHorizontal: spacing.s16 },
  deleteIconBtn: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.s12 },
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

export default ChatListScreen;

function SessionRow({
  session,
  selected,
  isDesktop,
  isTablet,
  onPress,
  onDelete,
}: {
  session: ChatSession;
  selected: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const rowContent = (
    <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <TouchableOpacity
        style={[
          ds.sessionRow,
          { flex: 1 },
          selected && { backgroundColor: colors.accent50, borderRadius: radii.lg },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink, flex: 1 }}
            numberOfLines={1}
          >
            {session.title}
          </Text>
          <Text style={{ fontSize: typography.fz11, color: colors.muted, marginLeft: spacing.s6 }}>
            {formatRelativeTime(session.updated_at)}
          </Text>
        </View>
        {session.last_message_preview ? (
          <Text
            style={{ fontSize: typography.fz11, color: colors.muted, marginTop: spacing.s2 }}
            numberOfLines={1}
          >
            {session.last_message_preview}
          </Text>
        ) : null}
      </TouchableOpacity>
      {(isDesktop || isTablet) && (
        <TouchableOpacity
          style={ds.deleteIconBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="x" size={12} color={colors.muted2} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (Platform.OS !== 'web') {
    return (
      <Swipeable
        friction={2}
        rightThreshold={60}
        overshootLeft={false}
        renderRightActions={() => (
          <TouchableOpacity style={ds.swipeDelete} onPress={onDelete}>
            <Text style={ds.swipeDeleteText}>삭제</Text>
          </TouchableOpacity>
        )}
      >
        {rowContent}
      </Swipeable>
    );
  }
  return rowContent;
}
