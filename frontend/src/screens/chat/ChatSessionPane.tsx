import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import { StyleSheet } from 'react-native';
import { chatApi, feedbacksApi } from '../../api';
import type { ChatMessageItem } from '../../api';
import { s } from './_chatShared';

interface Props {
  sessionId: string;
  cachedMessages?: ChatMessageItem[];
  onMessagesChange?: (msgs: ChatMessageItem[]) => void;
  onFirstMessage?: (text: string) => void;
  onMessageSent?: (text: string) => void;
}

const MOCK_AI_RESPONSE = '도움이 되도록 답변드릴게요. 다만 복약·치료 결정을 바꾸기 전에는 반드시 담당 의사·약사와 상담해주세요.';
const GREETING: ChatMessageItem = {
  message_id: -1,
  sender_type: 'assistant',
  content: '안녕하세요 👋 어떤 점이 궁금하신가요?',
};

export function ChatSessionPane({ sessionId, cachedMessages, onMessagesChange, onFirstMessage, onMessageSent }: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(cachedMessages ?? [GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<any>(null);
  const cachedRef = useRef(cachedMessages);
  const onMessagesChangeRef = useRef(onMessagesChange);
  useLayoutEffect(() => {
    cachedRef.current = cachedMessages;
    onMessagesChangeRef.current = onMessagesChange;
  });

  const updateMessages = (updater: (prev: ChatMessageItem[]) => ChatMessageItem[]) => {
    setMessages(prev => {
      const next = updater(prev);
      onMessagesChangeRef.current?.(next);
      return next;
    });
  };

  useEffect(() => {
    if (!sessionId) return;
    const cached = cachedRef.current;
    if (cached && cached.length > 0) {
      setMessages(cached);
      return;
    }
    setMessages([GREETING]);
    // TODO: [BE 대기] GET /chat/sessions/{session_id}/messages 미구현 — 구현 완료 후 mock 제거
    chatApi.getChatMessages(Number(sessionId), { limit: 50 })
      .then(res => {
        const msgs = res.messages.length > 0 ? res.messages : [GREETING];
        setMessages(msgs);
        onMessagesChangeRef.current?.(msgs);
      })
      .catch(err => {
        console.warn('[ChatPane] 메시지 로드 실패:', err);
        if (__DEV__) setMessages([GREETING]);
      });
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    inputRef.current?.clear?.();
    // web: Enter keypress adds '\n' to textarea after this sync clear — catch it
    requestAnimationFrame(() => { setInput(''); inputRef.current?.clear?.(); });
    setSendError('');

    const isFirst = messages.length === 1 && messages[0].message_id === -1;
    const tempId = Date.now();
    const userMsg: ChatMessageItem = { message_id: tempId, sender_type: 'user', content: text };
    updateMessages(prev => [...prev, userMsg]);
    if (isFirst) onFirstMessage?.(text);
    onMessageSent?.(text);
    setSending(true);

    try {
      // TODO: [BE 대기] POST /chat/sessions/{session_id}/messages 미구현 — 구현 완료 후 mock 제거
      const res = await chatApi.sendChatMessage(Number(sessionId), { message: text });
      const aiMsg: ChatMessageItem = {
        message_id: res.message_id,
        sender_type: 'assistant',
        content: res.answer,
        safety_flag: res.safety_flag,
        created_at: res.created_at,
      };
      updateMessages(prev => [...prev, aiMsg]);
      onMessageSent?.(aiMsg.content);
    } catch (err: any) {
      console.warn('[ChatPane] 메시지 전송 실패:', err);
      const status = err?.response?.status;
      if (status === 429) {
        setSendError('잠시 후 다시 시도해주세요.');
      } else if (__DEV__) {
        // TODO: [BE 대기] 목업 응답 — 구현 완료 후 제거
        await new Promise<void>(res => setTimeout(res, 1500));
        const SAFETY_KEYWORDS = ['자살', '자해', '죽고싶', '극단적선택'];
        const mockMsg: ChatMessageItem = {
          message_id: Date.now(),
          sender_type: 'assistant',
          content: MOCK_AI_RESPONSE,
          safety_flag: SAFETY_KEYWORDS.some(k => text.includes(k)),
        };
        updateMessages(prev => [...prev, mockMsg]);
        onMessageSent?.(mockMsg.content);
      } else {
        setSendError('메시지 전송에 실패했어요. 다시 시도해주세요.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* 의료 안내 배너 */}
      <View style={ps.noticeBanner}>
        <Icon name="alert-circle" size={13} color={colors.muted2} />
        <Text style={{ fontSize: typography.fz11, color: colors.muted, marginLeft: spacing.s4, flex: 1 }}>
          AI 답변은 의료 진단을 대체하지 않습니다.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.s16, paddingBottom: spacing.s16 }}
      >
        {messages.map((msg, i) => <Bubble key={msg.message_id ?? i} msg={msg} />)}
        {sending && (
          <View style={[s.bubbleRow, { alignItems: 'center', gap: spacing.s8 }]}>
            <View style={s.aiAvatar}><Text style={{ fontSize: 10, fontWeight: typography.fw7, color: colors.accent700 }}>AI</Text></View>
            <ActivityIndicator color={colors.accent} size="small" />
          </View>
        )}
      </ScrollView>

      {sendError ? (
        <Text style={{ fontSize: typography.fz12, color: colors.danger, textAlign: 'center', paddingVertical: spacing.s4, paddingHorizontal: spacing.s16 }}>
          {sendError}
        </Text>
      ) : null}

      <View style={s.inputBar}>
        <TextInput
          ref={inputRef}
          style={s.chatInput}
          placeholder="궁금한 점을 입력해주세요"
          placeholderTextColor={colors.muted2}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={Platform.OS !== 'web' ? send : undefined}
          onKeyPress={(e: any) => {
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
              e.nativeEvent.preventDefault?.();
              send();
            }
          }}
          returnKeyType="send"
          multiline
        />
        <Button variant="primary" size="sm" leftIcon="send" onPress={send} disabled={sending}>전송</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg }: { msg: ChatMessageItem }) {
  const [fb, setFb] = useState<'good' | 'bad' | null>(null);
  const isUser = msg.sender_type === 'user';
  const isSafe = msg.safety_flag === true;

  const submitFeedback = (rating: number, reportType?: string) => {
    feedbacksApi.createFeedback({
      chat_message_id: msg.message_id,
      rating,
      ...(reportType ? { report_type: reportType } : {}),
    }).catch(() => {});
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[s.bubbleRow, isUser && { justifyContent: 'flex-end' }]}>
        {!isUser && (
          <View style={s.aiAvatar}>
            <Text style={{ fontSize: 10, fontWeight: typography.fw7, color: colors.accent700 }}>AI</Text>
          </View>
        )}
        <View style={[
          s.bubble,
          isUser ? s.bubbleUser : s.bubbleAI,
          isSafe && { borderWidth: 1.5, borderColor: colors.danger },
        ]}>
          {isSafe && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.s4 }}>
              <Icon name="alert-circle" size={13} color={colors.danger} />
              <Text style={{ fontSize: typography.fz11, color: colors.danger, fontWeight: typography.fw6 }}>주의가 필요한 답변입니다</Text>
            </View>
          )}
          <Text style={{ fontSize: typography.fz13, lineHeight: 20, color: isUser ? colors.white : colors.ink }}>{msg.content}</Text>
        </View>
        {isUser && (
          <View style={s.userAvatar}>
            <Icon name="user" size={13} color={colors.accent700} />
          </View>
        )}
      </View>
      {!isUser && msg.message_id !== -1 && (
        <View style={{ flexDirection: 'row', gap: spacing.s8, marginLeft: 36, marginTop: spacing.s4 }}>
          <TouchableOpacity
            disabled={!!fb}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.s8, paddingVertical: spacing.s4, borderRadius: radii.sm, borderWidth: 1, borderColor: fb === 'good' ? colors.accent : colors.hairline, backgroundColor: fb === 'good' ? colors.accent50 : 'transparent', opacity: fb && fb !== 'good' ? 0.4 : 1 }}
            onPress={() => { if (fb) return; setFb('good'); submitFeedback(4); }}>
            <Text style={{ fontSize: typography.fz12 }}>👍</Text>
            <Text style={{ fontSize: typography.fz11, color: fb === 'good' ? colors.accent700 : colors.muted }}>도움됨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!!fb}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.s8, paddingVertical: spacing.s4, borderRadius: radii.sm, borderWidth: 1, borderColor: fb === 'bad' ? colors.danger : colors.hairline, backgroundColor: fb === 'bad' ? colors.danger50 : 'transparent', opacity: fb && fb !== 'bad' ? 0.4 : 1 }}
            onPress={() => { if (fb) return; setFb('bad'); submitFeedback(2); }}>
            <Text style={{ fontSize: typography.fz12 }}>👎</Text>
            <Text style={{ fontSize: typography.fz11, color: fb === 'bad' ? colors.danger : colors.muted }}>별로</Text>
          </TouchableOpacity>
          {isSafe && (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.s8, paddingVertical: spacing.s4, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.danger, backgroundColor: 'transparent' }}
              onPress={() => submitFeedback(2, 'chat_error')}>
              <Text style={{ fontSize: typography.fz11, color: colors.danger }}>신고하기</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const ps = StyleSheet.create({
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.s16,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
});

export default ChatSessionPane;
