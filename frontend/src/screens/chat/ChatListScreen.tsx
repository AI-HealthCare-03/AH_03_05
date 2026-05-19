import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useApp, Chat, ChatMessage } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing } from '../../theme';

export function ChatListScreen({ navigation }: any) {
  const { chats, setChats } = useApp();
  const [query, setQuery] = useState('');
  const filtered = chats.filter(c => !query || c.title.includes(query) || c.preview.includes(query));

  const startNew = () => {
    const newId = 'c' + Date.now();
    const newChat: Chat = { id: newId, title: '새 상담', preview: '', time: '방금', messages: [] };
    setChats([newChat, ...chats]);
    navigation.navigate('ChatSession', { chatId: newId });
  };

  return (
    <View style={s.root}>
      <View style={[s.topBar, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Text style={s.screenTitle}>상담 목록</Text>
          <TouchableOpacity style={s.btnPrimary} onPress={startNew}>
            <Icon name="plus" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>새 상담</Text>
          </TouchableOpacity>
        </View>
        <View style={s.searchBox}>
          <Icon name="search" size={14} color={colors.muted} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: colors.ink, marginLeft: 8, height: 36 }}
            placeholder="검색"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.s2 }}>
        {chats.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 48 }}>
            <Icon name="chat" size={36} color={colors.muted2} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: 14, marginBottom: 6 }}>아직 상담 내역이 없어요</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20, textAlign: 'center' }}>복약·생활습관 관련 궁금한 점을 물어보세요.</Text>
            <TouchableOpacity style={s.btnPrimary} onPress={startNew}>
              <Icon name="plus" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>+ 새 상담 시작하기</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', padding: 24 }}>검색 결과가 없어요</Text>
        ) : (
          filtered.map(c => (
            <TouchableOpacity key={c.id} style={s.chatItem} onPress={() => navigation.navigate('ChatSession', { chatId: c.id })}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }} numberOfLines={1}>{c.title}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 8 }}>{c.time}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>{c.preview}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const EMERGENCY_KEYWORDS = ['흉통', '호흡곤란', '의식 잃', '심한 출혈', '토혈', '검은 변'];
const DANGER_KEYWORDS = ['중단', '끊어', '끊기', '뺄', '생략', '줄여', '늘려', '반으로', '복약 중단', '약 끊'];

export function ChatSessionScreen({ navigation, route }: any) {
  const { chats, setChats } = useApp();
  const chatId = route?.params?.chatId;
  const current = chats.find(c => c.id === chatId) || chats[0];
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [current?.messages.length]);

  const send = () => {
    if (!input.trim() || !current) return;
    const msg = input.trim();
    setInput('');

    // Add user message + auto-generate title from first message
    setChats(prev => prev.map(c => {
      if (c.id !== current.id) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        title: isFirst ? msg.substring(0, 20) + (msg.length > 20 ? '…' : '') : c.title,
        preview: msg.substring(0, 30),
        messages: [...c.messages, { from: 'user' as const, text: msg }],
      };
    }));

    setTimeout(() => {
      const hasEmergency = EMERGENCY_KEYWORDS.some(k => msg.includes(k));
      const hasDanger = DANGER_KEYWORDS.some(k => msg.includes(k));

      let response: ChatMessage;
      if (hasEmergency) {
        response = { from: 'warn' as const, text: '⚠️ 즉시 119에 연락하거나 응급실로 가세요. 심한 흉통·호흡곤란·의식 변화 등은 즉각적인 의료 처치가 필요한 응급 증상입니다.' };
      } else if (hasDanger) {
        response = { from: 'warn' as const, text: '⚠️ 의료 판단이 필요한 질문입니다. 복약 중단이나 용량 변경은 반드시 담당 의사·약사와 상담 후 결정해주세요.' };
      } else {
        response = { from: 'ai' as const, text: '도움이 되도록 답변드릴게요. 다만 복약·치료 결정을 바꾸기 전에는 반드시 담당 의사·약사와 상담해주세요.' };
      }

      setChats(prev => prev.map(c => c.id === current.id
        ? { ...c, messages: [...c.messages, response] }
        : c));
    }, 600);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }} numberOfLines={1}>{current?.title}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{current?.preview || '상담을 이어가보세요.'}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.s5, paddingBottom: 20 }}>
        {!current?.messages.length && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>무엇이든 물어보세요</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>예) "혈압약 먹는데 사우나 가도 되나요?"</Text>
          </View>
        )}
        {current?.messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
      </ScrollView>

      {/* 상시 안전 고지 (REQ-SAFE-001) */}
      <View style={{ backgroundColor: colors.surface2, paddingHorizontal: 16, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
        <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>
          본 챗봇은 진단·처방을 대체하지 않습니다. 의료 판단은 의사·약사와 상담하세요.
        </Text>
      </View>

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          style={s.chatInput}
          placeholder="궁금한 점을 입력해주세요"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity style={s.sendBtn} onPress={send}>
          <Icon name="send" size={13} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const [fb, setFb] = useState<'good' | 'bad' | null>(null);

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
          <View style={s.aiAvatar}><Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent700 }}>AI</Text></View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: isUser ? '#fff' : colors.ink }}>{msg.text}</Text>
        </View>
        {isUser && (
          <View style={s.userAvatar}><Icon name="user" size={13} color={colors.accent700} /></View>
        )}
      </View>
      {/* 👍/👎 피드백 (AI 메시지만, REQ-FB-001) */}
      {!isUser && (
        <View style={{ flexDirection: 'row', gap: 8, marginLeft: 36, marginTop: 4 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: fb === 'good' ? colors.accent : colors.hairline, backgroundColor: fb === 'good' ? colors.accent50 : 'transparent' }}
            onPress={() => setFb('good')}>
            <Text style={{ fontSize: 12 }}>👍</Text>
            <Text style={{ fontSize: 11, color: fb === 'good' ? colors.accent700 : colors.muted }}>도움됨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: fb === 'bad' ? colors.danger : colors.hairline, backgroundColor: fb === 'bad' ? colors.danger50 : 'transparent' }}
            onPress={() => setFb('bad')}>
            <Text style={{ fontSize: 12 }}>👎</Text>
            <Text style={{ fontSize: 11, color: fb === 'bad' ? colors.danger : colors.muted }}>별로</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topBar: { paddingHorizontal: spacing.s4, paddingTop: 52, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.hairline, flexDirection: 'row', alignItems: 'center' },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: 12, backgroundColor: colors.surface, alignSelf: 'stretch' },
  chatItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.hairline },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.s4, backgroundColor: colors.surface, borderTopWidth: 0.5, borderTopColor: colors.hairline },
  chatInput: { flex: 1, borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink, maxHeight: 100, backgroundColor: colors.surface },
  sendBtn: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  bubble: { maxWidth: '70%', padding: 12, borderRadius: 14 },
  bubbleUser: { backgroundColor: colors.accent },
  bubbleAI:  { backgroundColor: colors.surface2, borderWidth: 0.5, borderColor: colors.hairline },
  aiAvatar: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 28, height: 28, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },
  warnBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning50, borderRadius: radii.md, padding: 12, marginBottom: 14 },
});

export default ChatListScreen;
