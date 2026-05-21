import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp, Chat, ChatMessage } from '../../context/AppContext';
import Icon from '../../components/Icon';
import BellButton from '../../components/BellButton';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { colors, radii, spacing } from '../../theme';

const EMERGENCY_KEYWORDS = ['흉통', '호흡곤란', '의식 잃', '심한 출혈', '토혈', '검은 변'];
const DANGER_KEYWORDS = ['중단', '끊어', '끊기', '뺄', '생략', '줄여', '늘려', '반으로', '복약 중단', '약 끊'];

// 채팅 time 문자열 → 날짜 구분선용 포맷
function resolveDateLabel(time: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (time === '방금' || time === '오늘') {
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  }
  if (time === '어제') {
    const d = new Date(now); d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }
  return time; // "5월 1일" 등 그대로
}

export function ChatListScreen({ navigation }: any) {
  const { chats, setChats } = useApp();
  const { isMobile } = useBreakpoint();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 모바일: 진입 시 가장 최근 채팅 자동 선택
  useEffect(() => {
    if (isMobile && chats.length > 0) {
      setSelectedId(prev => prev ?? chats[0].id);
    }
  }, [isMobile]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const filtered = chats.filter(
    c => !query || c.title.includes(query) || c.preview.includes(query),
  );
  const current = chats.find(c => c.id === selectedId) ?? null;

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [current?.messages.length]);

  const startNew = () => {
    const newId = 'c' + Date.now();
    const newChat: Chat = {
      id: newId,
      title: '새 상담',
      preview: '',
      time: '방금',
      messages: [],
    };
    setChats([newChat, ...chats]);
    setSelectedId(newId);
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const send = () => {
    if (!input.trim() || !current) return;
    const msg = input.trim();
    setInput('');

    setChats(prev =>
      prev.map(c => {
        if (c.id !== current.id) return c;
        const isFirst = c.messages.length === 0;
        return {
          ...c,
          title: isFirst
            ? msg.substring(0, 20) + (msg.length > 20 ? '…' : '')
            : c.title,
          preview: msg.substring(0, 30),
          messages: [...c.messages, { from: 'user' as const, text: msg }],
        };
      }),
    );

    setTimeout(() => {
      const hasEmergency = EMERGENCY_KEYWORDS.some(k => msg.includes(k));
      const hasDanger = DANGER_KEYWORDS.some(k => msg.includes(k));

      let response: ChatMessage;
      if (hasEmergency) {
        response = { from: 'warn' as const, text: '⚠️ 즉시 119에 연락하거나 응급실로 가세요. 심한 흉통·호흡곤란·의식 변화 등은 즉각적인 의료 처치가 필요한 응급 증상입니다.' };
      } else if (hasDanger) {
        response = { from: 'warn' as const, text: '복약 중단·변경은 반드시 담당 의사와 상담해야 해요.' };
      } else {
        response = { from: 'ai' as const, text: '도움이 되도록 답변드릴게요. 다만 복약·치료 결정을 바꾸기 전에는 반드시 담당 의사·약사와 상담해주세요.' };
      }

      setChats(prev =>
        prev.map(c =>
          c.id === current.id ? { ...c, messages: [...c.messages, response] } : c,
        ),
      );
    }, 600);
  };

  return (
    <View style={s.root}>
      <BellButton />

      {/* 페이지 타이틀 */}
      <View style={[s.pageHeader, isMobile && { paddingHorizontal: spacing.s4 }]}>
        <Text style={s.pageTitle}>건강 상담</Text>
      </View>

      {/* 스플릿 패널 */}
      <View style={[s.splitWrap, isMobile && { flexDirection: 'column', paddingBottom: spacing.s4, gap: 0 }]}>

        {/* ── 왼쪽: 상담 목록 (모바일: 채팅 선택 전에만 표시) ── */}
        {(!isMobile || !selectedId) && (
        <View style={[s.leftPanel, isMobile && { width: '100%', flex: undefined }]}>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>상담 목록</Text>
            <TouchableOpacity style={s.btnPrimary} onPress={startNew}>
              <Icon name="plus" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>새 상담</Text>
            </TouchableOpacity>
          </View>

          <View style={s.searchBox}>
            <Icon name="search" size={14} color={colors.muted} />
            <TextInput
              style={[{ flex: 1, fontSize: 14, color: colors.ink, marginLeft: 8, height: 36 }, { outlineWidth: 0 } as any]}
              placeholder="검색"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingVertical: spacing.s2 }}>
            {chats.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Icon name="chat" size={28} color={colors.muted2} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 12, marginBottom: 4 }}>
                  아직 상담 내역이 없어요
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 16 }}>
                  복약·생활습관 관련 궁금한 점을 물어보세요.
                </Text>
                <TouchableOpacity style={s.btnPrimary} onPress={startNew}>
                  <Icon name="plus" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>새 상담 시작하기</Text>
                </TouchableOpacity>
              </View>
            ) : filtered.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', padding: 24 }}>검색 결과가 없어요</Text>
            ) : (
              filtered.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chatItem, selectedId === c.id && s.chatItemActive]}
                  onPress={() => setSelectedId(c.id)}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[s.chatItemTitle, selectedId === c.id && { color: colors.accent700 }]} numberOfLines={1}>
                        {c.title}
                      </Text>
                      <Text style={s.chatItemTime}>{c.time}</Text>
                    </View>
                    <Text style={s.chatItemPreview} numberOfLines={1}>{c.preview}</Text>
                  </View>
                  {/* 삭제 버튼 — 데스크톱만 표시 */}
                  {!isMobile && (
                  <TouchableOpacity
                    style={s.iconBtn}
                    onPress={e => { e.stopPropagation?.(); deleteChat(c.id); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="trash" size={14} color={colors.muted2} />
                  </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
        )}

        {/* ── 오른쪽: 채팅 또는 빈 상태 (모바일: 채팅 선택 후에만 표시) ── */}
        {(!isMobile || !!selectedId) && (
        <View style={s.rightPanel}>
          {!current ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Icon name="cpu" size={26} color={colors.accent} />
              </View>
              <Text style={s.emptyTitle}>상담을 선택해 주세요</Text>
              <Text style={s.emptySubtitle}>또는 새 상담을 시작하세요</Text>
            </View>
          ) : (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

              {/* 채팅 헤더 */}
              <View style={s.chatHeader}>
                <TouchableOpacity onPress={() => setSelectedId(null)} style={s.iconBtn}>
                  <Icon name="arrow-left" size={16} color={colors.ink2} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={s.chatTitle} numberOfLines={1}>{current.title}</Text>
                  <Text style={s.chatSubtitle} numberOfLines={1}>
                    {current.preview || '상담을 이어가보세요.'}
                  </Text>
                </View>
              </View>

              {/* 메시지 영역 */}
              <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.s4, paddingBottom: 20 }}>

                {/* 날짜 구분선 */}
                <View style={s.dateSep}>
                  <Text style={s.dateSepText}>{resolveDateLabel(current.time)}</Text>
                </View>

                {/* 빈 채팅 초기 AI 인사 버블 */}
                {current.messages.length === 0 && (
                  <View style={s.bubbleRow}>
                    <View style={s.aiAvatar}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent700 }}>AI</Text>
                    </View>
                    <View style={[s.bubble, s.bubbleAI]}>
                      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.ink }}>
                        안녕하세요 👋{'\n'}어떤 점이 궁금하신가요?
                      </Text>
                    </View>
                  </View>
                )}

                {current.messages.map((msg, i) => (
                  <Bubble key={i} msg={msg} />
                ))}
              </ScrollView>

              {/* 안전 고지 */}
              <View style={s.disclaimer}>
                <Text style={s.disclaimerText}>본 서비스는 정보 제공이며 전문의 진료를 대체하지 않아요.</Text>
              </View>

              {/* 입력창 */}
              <View style={s.inputBar}>
                <TextInput
                  style={[s.chatInput, { outlineWidth: 0 } as any]}
                  placeholder="궁금한 점을 입력해주세요"
                  placeholderTextColor={colors.muted}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={send}
                  returnKeyType="send"
                  multiline
                />
                <TouchableOpacity style={[s.sendBtn, !isMobile && { width: undefined, paddingHorizontal: 14, paddingVertical: 10 }]} onPress={send}>
                  <Icon name="send" size={13} color="#fff" />
                  {!isMobile && (
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>전송</Text>
                  )}
                </TouchableOpacity>
              </View>

            </KeyboardAvoidingView>
          )}
        </View>
        )}

      </View>
    </View>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  if (msg.from === 'warn') {
    return (
      <View style={s.warnBubble}>
        <Icon name="alert-circle" size={14} color={colors.warning} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink, marginLeft: 6, flex: 1 }}>{msg.text}</Text>
      </View>
    );
  }

  const isUser = msg.from === 'user';
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[s.bubbleRow, isUser && { justifyContent: 'flex-end' }]}>
        {!isUser && (
          <View style={s.aiAvatar}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent700 }}>AI</Text>
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: isUser ? '#fff' : colors.ink }}>{msg.text}</Text>
        </View>
        {isUser && (
          <View style={s.userAvatar}>
            <Icon name="user" size={13} color={colors.accent700} />
          </View>
        )}
      </View>
    </View>
  );
}

// 네비게이션 스택 호환용
export function ChatSessionScreen({ navigation }: any) {
  useEffect(() => { navigation.replace('ChatList'); }, []);
  return null;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },


  // 페이지 헤더 — paddingHorizontal s4 (HomeScreen 기준), paddingTop 28
  pageHeader: {
    paddingHorizontal: spacing.s4,
    paddingTop: 28,
    paddingBottom: 14,
    maxWidth: 920,
    alignSelf: 'center' as any,
    width: '100%',
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },

  splitWrap: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.s4,
    paddingBottom: spacing.s4,
    gap: 10,
    maxWidth: 920,
    alignSelf: 'center' as any,
    width: '100%',
  },

  // 왼쪽 패널
  leftPanel: {
    width: 320,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    overflow: 'hidden',
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.s4, paddingTop: spacing.s4, paddingBottom: spacing.s3,
  },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.s3, marginBottom: spacing.s2,
    borderWidth: 1, borderColor: colors.hairlineStrong,
    borderRadius: radii.md, paddingHorizontal: 10,
    backgroundColor: colors.canvas,
  },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: spacing.s4, paddingRight: spacing.s2,
    paddingVertical: 12,
    marginHorizontal: spacing.s2,
    borderRadius: radii.md, marginBottom: 2, gap: 4,
  },
  chatItemActive: { backgroundColor: colors.accent50 },
  chatItemTitle: { fontSize: 13, fontWeight: '600', color: colors.ink, flex: 1, marginRight: 8 },
  chatItemPreview: { fontSize: 12, color: colors.muted, marginTop: 2 },
  chatItemTime: { fontSize: 11, color: colors.muted, flexShrink: 0 },

  // 오른쪽 패널
  rightPanel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    overflow: 'hidden',
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  // 빈 상태
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 999,
    backgroundColor: colors.accent50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  emptySubtitle: { fontSize: 13, color: colors.muted },

  // 채팅 헤더
  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.s4, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: colors.hairline,
    backgroundColor: colors.surface,
  },

  // 날짜 구분선
  dateSep: { alignItems: 'center', marginBottom: 16, marginTop: 4 },
  dateSepText: { fontSize: 12, color: colors.muted },

  // 공용 아이콘 버튼 — 삭제 버튼도 이 스타일 사용
  iconBtn: { width: 32, height: 32, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },

  chatTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  chatSubtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },

  // 안전 고지
  disclaimer: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 16, paddingVertical: 6,
    borderTopWidth: 0.5, borderTopColor: colors.hairline,
  },
  disclaimerText: { fontSize: 11, color: colors.muted, textAlign: 'center' },

  // 입력창
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: spacing.s4,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5, borderTopColor: colors.hairline,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1, borderColor: colors.hairlineStrong,
    borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.ink, maxHeight: 100,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    flexDirection: 'row', backgroundColor: colors.accent,
    borderRadius: radii.pill, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },

  // 버튼
  btnPrimary: {
    flexDirection: 'row', backgroundColor: colors.accent,
    borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },

  // 말풍선
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  bubble: { maxWidth: '70%', padding: 12, borderRadius: radii.md },
  bubbleUser: { backgroundColor: colors.accent },
  bubbleAI: { backgroundColor: colors.surface2, borderWidth: 0.5, borderColor: colors.hairline },
  aiAvatar: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },
  warnBubble: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.warning50, borderRadius: radii.md,
    padding: 12, marginBottom: 14,
  },
});

export default ChatListScreen;
