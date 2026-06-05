import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import { StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { chatApi, feedbacksApi, ragApi, extractApiError } from '../../api';
import type { ChatMessageItem, RagSource } from '../../api';
import { s } from './_chatShared';

interface Props {
  sessionId: string;
  cachedMessages?: ChatMessageItem[];
  onMessagesChange?: (msgs: ChatMessageItem[]) => void;
  onFirstMessage?: (text: string) => void;
  onMessageSent?: (text: string) => void;
}

const GREETING: ChatMessageItem = {
  message_id: -1,
  sender_type: 'assistant',
  content: '안녕하세요 👋 어떤 점이 궁금하신가요?',
};


export function ChatSessionPane({
  sessionId,
  cachedMessages,
  onMessagesChange,
  onFirstMessage,
  onMessageSent,
}: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(cachedMessages ?? [GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput | null>(null);
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
    chatApi
      .getChatMessages(Number(sessionId), { limit: 50 })
      .then(res => {
        const msgs = res.items.length > 0 ? res.items : [GREETING];
        setMessages(msgs);
        onMessagesChangeRef.current?.(msgs);
      })
      .catch(() => {
        setMessages([GREETING]);
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
    requestAnimationFrame(() => {
      setInput('');
      inputRef.current?.clear?.();
    });
    setSendError('');

    const isFirst = messages.length === 1 && messages[0].message_id === -1;
    const tempId = Date.now();
    const userMsg: ChatMessageItem = { message_id: tempId, sender_type: 'user', content: text };
    updateMessages(prev => [...prev, userMsg]);
    if (isFirst) onFirstMessage?.(text);
    onMessageSent?.(text);
    setSending(true);

    try {
      const [res, ragSources] = await Promise.all([
        chatApi.sendChatMessage(Number(sessionId), { message: text }),
        ragApi.searchGuidelines(text).catch(() => [] as RagSource[]),
      ]);
      const aiMsg: ChatMessageItem = {
        message_id: Date.now(),
        sender_type: 'assistant',
        content: res.assistant_message,
        safety_flag: res.safety_flag,
        safety_notice: res.safety_notice,
        category: res.category,
        created_at: new Date().toISOString(),
        rag_sources: ragSources.length > 0 ? ragSources : undefined,
      };
      updateMessages(prev => [...prev, aiMsg]);
      onMessageSent?.(aiMsg.content);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setSendError('잠시 후 다시 시도해주세요.');
      } else {
        setSendError('메시지 전송에 실패했어요. 다시 시도해주세요.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* 의료 안내 배너 */}
      <View style={ps.noticeBanner}>
        <Icon name="alert-circle" size={13} color={colors.muted2} />
        <Text
          style={{
            fontSize: typography.fz11,
            color: colors.muted,
            marginLeft: spacing.s4,
            flex: 1,
          }}
        >
          AI 답변은 의료 진단을 대체하지 않습니다.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ padding: spacing.s16, paddingBottom: spacing.s16 }}
      >
        {messages.map((msg, i) => (
          <Bubble key={msg.message_id ?? i} msg={msg} />
        ))}
        {sending && (
          <View style={[s.bubbleRow, { alignItems: 'center', gap: spacing.s8 }]}>
            <View style={s.aiAvatar}>
              <Text style={{ fontSize: 10, fontWeight: typography.fw7, color: colors.accent700 }}>
                AI
              </Text>
            </View>
            <ActivityIndicator color={colors.accent} size="small" />
          </View>
        )}
      </ScrollView>

      {sendError ? (
        <Text
          style={{
            fontSize: typography.fz12,
            color: colors.danger,
            textAlign: 'center',
            paddingVertical: spacing.s4,
            paddingHorizontal: spacing.s16,
          }}
        >
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
        <Button variant="primary" size="sm" leftIcon="send" onPress={send} disabled={sending}>
          전송
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const Bubble = React.memo(function Bubble({ msg }: { msg: ChatMessageItem }) {
  const [fb, setFb] = useState<'good' | 'bad' | null>(null);
  const { flash } = useApp();
  const isUser = msg.sender_type?.toLowerCase() === 'user';
  const isFlagged = msg.safety_flag === true;

  const submitFeedback = (rating: number, reportType?: string) => {
    feedbacksApi
      .createFeedback({
        chat_message_id: msg.message_id,
        rating,
        ...(reportType ? { report_type: reportType } : {}),
      })
      .catch(e => flash(extractApiError(e)));
  };

  return (
    <View style={{ marginBottom: spacing.s14 }}>
      <View style={[s.bubbleRow, isUser && { justifyContent: 'flex-end' }]}>
        {!isUser && (
          <View style={s.aiAvatar}>
            <Text style={{ fontSize: 10, fontWeight: typography.fw7, color: colors.accent700 }}>
              AI
            </Text>
          </View>
        )}
        <View
          style={[
            s.bubble,
            isUser ? s.bubbleUser : s.bubbleAI,
            !isUser && msg.category && CATEGORY_BUBBLE_BG[msg.category] != null && {
              backgroundColor: CATEGORY_BUBBLE_BG[msg.category],
            },
            !isUser && msg.category === 'emergency' && !isFlagged && {
              borderColor: colors.danger,
              borderWidth: 1,
            },
            isFlagged && { borderWidth: 1.5, borderColor: colors.danger },
          ]}
        >
          {!isUser && msg.category && (
            <View style={{ alignSelf: 'flex-end', marginBottom: spacing.s4 }}>
              <CategoryBadge category={msg.category} />
            </View>
          )}
          {isFlagged && (
            <View style={{ marginBottom: spacing.s8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.s4,
                  marginBottom: spacing.s4,
                }}
              >
                <Icon name="alert-circle" size={13} color={colors.danger} />
                <Text
                  style={{
                    fontSize: typography.fz11,
                    color: colors.danger,
                    fontWeight: typography.fw6,
                  }}
                >
                  주의가 필요한 답변입니다
                </Text>
              </View>
              {msg.safety_notice && (
                <View
                  style={{
                    backgroundColor: colors.danger50,
                    borderRadius: radii.sm,
                    padding: spacing.s8,
                  }}
                >
                  <Text style={{ fontSize: typography.fz12, color: colors.danger, lineHeight: 18 }}>
                    {msg.safety_notice}
                  </Text>
                </View>
              )}
            </View>
          )}
          <Text
            style={{
              fontSize: typography.fz13,
              lineHeight: 20,
              color: isUser ? colors.white : colors.ink,
            }}
          >
            {msg.content}
          </Text>
        </View>
        {isUser && (
          <View style={s.userAvatar}>
            <Icon name="user" size={13} color={colors.accent700} />
          </View>
        )}
      </View>
      {!isUser && msg.message_id !== -1 && (
        <>
          {msg.summary && <SummarySection summary={msg.summary} />}
          {msg.rag_sources && msg.rag_sources.length > 0 && (
            <RagSourcesSection sources={msg.rag_sources} />
          )}
          <View
            style={{ flexDirection: 'row', gap: spacing.s8, marginLeft: 36, marginTop: spacing.s4 }}
          >
            <TouchableOpacity
              disabled={!!fb}
              style={[
                ps.feedbackBtn,
                {
                  borderColor: fb === 'good' ? colors.accent : colors.hairline,
                  backgroundColor: fb === 'good' ? colors.accent50 : 'transparent',
                  opacity: fb && fb !== 'good' ? 0.4 : 1,
                },
              ]}
              onPress={() => {
                if (fb) return;
                setFb('good');
                submitFeedback(4);
              }}
            >
              <Text style={{ fontSize: typography.fz12 }}>👍</Text>
              <Text
                style={{
                  fontSize: typography.fz11,
                  color: fb === 'good' ? colors.accent700 : colors.muted,
                }}
              >
                도움됨
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!!fb}
              style={[
                ps.feedbackBtn,
                {
                  borderColor: fb === 'bad' ? colors.danger : colors.hairline,
                  backgroundColor: fb === 'bad' ? colors.danger50 : 'transparent',
                  opacity: fb && fb !== 'bad' ? 0.4 : 1,
                },
              ]}
              onPress={() => {
                if (fb) return;
                setFb('bad');
                submitFeedback(2);
              }}
            >
              <Text style={{ fontSize: typography.fz12 }}>👎</Text>
              <Text
                style={{
                  fontSize: typography.fz11,
                  color: fb === 'bad' ? colors.danger : colors.muted,
                }}
              >
                별로
              </Text>
            </TouchableOpacity>
            {isFlagged && (
              <TouchableOpacity
                style={[ps.feedbackBtn, { borderColor: colors.danger }]}
                onPress={() => submitFeedback(2, 'chat_error')}
              >
                <Text style={{ fontSize: typography.fz11, color: colors.danger }}>신고하기</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
});

const ps = StyleSheet.create({
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s8,
    paddingVertical: spacing.s4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
});

// ─── Inline helper components ────────────────────────────────────────────────

type MessageCategory = 'general' | 'side_effect' | 'dosage_timing' | 'lifestyle' | 'emergency';

const CATEGORY_LABEL: Record<MessageCategory, string> = {
  general: '일반',
  side_effect: '부작용',
  dosage_timing: '복용 시간·용량',
  lifestyle: '생활습관',
  emergency: '응급',
};

const CATEGORY_STYLE: Record<MessageCategory, { bg: string; fg: string }> = {
  general: { bg: colors.surface2, fg: colors.muted },
  side_effect: { bg: colors.danger50, fg: colors.danger },
  dosage_timing: { bg: colors.accent50, fg: colors.accent700 },
  lifestyle: { bg: colors.success50, fg: colors.success },
  emergency: { bg: colors.danger, fg: colors.white },
};

const CATEGORY_BUBBLE_BG: Partial<Record<MessageCategory, string>> = {
  side_effect: colors.danger50,
  dosage_timing: colors.accent50,
  lifestyle: colors.success50,
  emergency: colors.danger50,
};

function CategoryBadge({ category }: { category: MessageCategory }) {
  const style = CATEGORY_STYLE[category] ?? { bg: colors.surface2, fg: colors.muted };
  return (
    <View
      style={{
        backgroundColor: style.bg,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.s8,
        paddingVertical: spacing.s2,
      }}
    >
      <Text style={{ fontSize: typography.fz11, color: style.fg, fontWeight: typography.fw6 }}>
        {CATEGORY_LABEL[category]}
      </Text>
    </View>
  );
}

function SummarySection({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ marginLeft: 36, marginTop: spacing.s4 }}>
      <TouchableOpacity
        onPress={() => setExpanded(p => !p)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.s4,
          alignSelf: 'flex-start',
        }}
        activeOpacity={0.7}
      >
        <Icon name="info" size={11} color={colors.muted} />
        <Text style={{ fontSize: typography.fz11, color: colors.muted }}>
          요약 {expanded ? '접기' : '보기'}
        </Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={11} color={colors.muted} />
      </TouchableOpacity>
      {expanded && (
        <View
          style={{
            backgroundColor: colors.accent50,
            borderRadius: radii.sm,
            padding: spacing.s8,
            marginTop: spacing.s4,
          }}
        >
          <Text style={{ fontSize: typography.fz12, color: colors.ink2, lineHeight: 18 }}>
            {summary}
          </Text>
        </View>
      )}
    </View>
  );
}

function RagSourcesSection({ sources }: { sources: RagSource[] }) {
  const displayed = sources.slice(0, 3);
  const overflow = sources.length - 3;
  return (
    <View style={{ marginLeft: 36, marginTop: spacing.s6 }}>
      <Text style={{ fontSize: typography.fz11, color: colors.muted, marginBottom: spacing.s4 }}>
        참고 자료
      </Text>
      {displayed.map(src => (
        <TouchableOpacity
          key={src.source_id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.s4,
            paddingVertical: spacing.s2,
          }}
          onPress={() => Linking.openURL(src.source_url)}
          activeOpacity={0.7}
        >
          <Icon name="link" size={11} color={colors.accent} />
          <Text
            style={{ fontSize: typography.fz11, color: colors.accent, flex: 1 }}
            numberOfLines={1}
          >
            {src.organization_name} · {src.guideline_title}
          </Text>
        </TouchableOpacity>
      ))}
      {overflow > 0 && (
        <Text style={{ fontSize: typography.fz11, color: colors.muted, marginTop: spacing.s2 }}>
          외 {overflow}개
        </Text>
      )}
    </View>
  );
}

export default ChatSessionPane;
