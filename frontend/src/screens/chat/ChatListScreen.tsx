// TODO: 채팅 삭제 기능 미구현
//   - 백엔드 엔드포인트 확인 필요: DELETE /chat/sessions/{id}
//   - chat.ts에 deleteChatSession() 함수 추가 필요
//   - ChatListScreen에 스와이프 삭제 UI 구현 필요 (react-native-gesture-handler Swipeable 또는 커스텀)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useApp, Chat } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ChatSessionPane } from './ChatSessionPane';
import { s } from './_chatShared';

export function ChatListScreen({ navigation }: any) {
  // TODO: [BE 대기] GET /chat/sessions 백엔드 미구현 — 구현 완료 후 AppContext 목업 대신 API 응답으로 교체 필요
  const { chats, setChats } = useApp();
  const [query, setQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { isDesktop } = useBreakpoint();

  const filtered = chats.filter(c => !query || c.title.includes(query) || c.preview.includes(query));

  const startNew = () => {
    // TODO: [BE 대기] POST /chat/sessions 백엔드 미구현 — 구현 완료 후 연결 필요
    const newId = 'c' + Date.now();
    const newChat: Chat = { id: newId, title: '새 상담', preview: '', time: '방금', messages: [] };
    setChats([newChat, ...chats]);
    if (isDesktop) {
      setSelectedChatId(newId);
    } else {
      navigation.navigate('ChatSession', { chatId: newId });
    }
  };

  const openSession = (chatId: string) => {
    if (isDesktop) {
      setSelectedChatId(chatId);
    } else {
      navigation.navigate('ChatSession', { chatId });
    }
  };

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
      {chats.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 48 }}>
          <Icon name="chat" size={36} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink, marginTop: 14, marginBottom: 6 }}>아직 상담 내역이 없어요</Text>
          <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20, textAlign: 'center' }}>복약·생활습관 관련 궁금한 점을 물어보세요.</Text>
          <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>+ 새 상담 시작하기</Button>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: 'center', padding: spacing.s24 }}>검색 결과가 없어요</Text>
      ) : (
        filtered.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.chatItem, isDesktop && selectedChatId === c.id && ds.chatItemSelected]}
            onPress={() => openSession(c.id)}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }} numberOfLines={1}>{c.title}</Text>
                <Text style={{ fontSize: typography.fz11, color: colors.muted, marginLeft: spacing.s8 }}>{c.time}</Text>
              </View>
              <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>{c.preview}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </>
  );

  // ── Desktop: split layout ──────────────────────────────────────────────────
  if (isDesktop) {
    const selectedChat = chats.find(c => c.id === selectedChatId);

    return (
      <View style={ds.root}>
        {/* Left: session list */}
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

        {/* Right: chat pane or empty state */}
        <View style={ds.pane}>
          {selectedChatId ? (
            <>
              <View style={ds.paneHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={ds.paneTitle} numberOfLines={1}>{selectedChat?.title ?? '상담'}</Text>
                  {!!selectedChat?.preview && (
                    <Text style={ds.paneSubtitle} numberOfLines={1}>{selectedChat.preview}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setSelectedChatId(null)} style={ds.closeBtn}>
                  <Icon name="x" size={14} color={colors.ink2} />
                </TouchableOpacity>
              </View>
              <ChatSessionPane chatId={selectedChatId} />
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

  // ── Mobile / Tablet: existing stack navigation ─────────────────────────────
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
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.canvas,
  },
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
    backgroundColor: colors.surface,
    paddingTop: spacing.safeTop,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s16,
    paddingBottom: spacing.s12,
  },
  sidebarTitle: {
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    color: colors.ink,
  },
  chatItemSelected: {
    backgroundColor: colors.accent50,
    borderColor: colors.accent,
  },
  pane: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  paneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.safeTop,
    paddingBottom: 14,
    paddingHorizontal: spacing.s20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  paneTitle: {
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    color: colors.ink,
  },
  paneSubtitle: {
    fontSize: typography.fz13,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.s12,
  },
});

export default ChatListScreen;
