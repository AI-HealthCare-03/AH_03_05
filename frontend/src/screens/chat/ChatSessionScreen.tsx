import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useApp, ChatMessage } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_chatShared';

const EMERGENCY_KEYWORDS = ['흉통', '호흡곤란', '의식 잃', '심한 출혈', '토혈', '검은 변'];
const DANGER_KEYWORDS = ['중단', '끊어', '끊기', '뺄', '생략', '줄여', '늘려', '반으로', '복약 중단', '약 끊'];

export function ChatSessionScreen({ navigation, route }: any) {
  const { chats, setChats } = useApp();
  const chatId = route?.params?.chatId;
  const current = chats.find(c => c.id === chatId) ?? null;
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [current?.messages.length]);

  const send = () => {
    if (!input.trim() || !current) return;
    const msg = input.trim();
    setInput('');

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

  if (!current) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: typography.fz14, color: colors.muted }}>상담 내역을 찾을 수 없어요.</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <ScreenLayout
        title={current?.title}
        subtitle={current?.preview || '상담을 이어가보세요.'}
        back
        onBack={() => navigation.goBack()}
        scrollable
        scrollRef={scrollRef}
        scrollPadding={false}
        contentStyle={{ padding: spacing.s20, paddingBottom: spacing.s20 }}
      >
        {!current?.messages.length && (
          <View style={{ alignItems: 'center', padding: spacing.s40 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink, marginBottom: spacing.s8 }}>무엇이든 물어보세요</Text>
            <Text style={{ fontSize: typography.fz13, color: colors.muted }}>예) "혈압약 먹는데 사우나 가도 되나요?"</Text>
          </View>
        )}
        {current?.messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
      </ScreenLayout>

      {/* 상시 안전 고지 (REQ-SAFE-001) */}
      <View style={cs.safetyNotice}>
        <Text style={{ fontSize: typography.fz11, color: colors.muted, textAlign: 'center' }}>
          본 챗봇은 진단·처방을 대체하지 않습니다. 의료 판단은 의사·약사와 상담하세요.
        </Text>
      </View>

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
        <Button variant="primary" size="sm" leftIcon="send" onPress={send}>전송</Button>
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
        <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink, marginLeft: 6, flex: 1 }}>{msg.text}</Text>
      </View>
    );
  }
  const isUser = msg.from === 'user';
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={[s.bubbleRow, isUser && { justifyContent: 'flex-end' }]}>
        {!isUser && (
          <View style={s.aiAvatar}><Text style={{ fontSize: 10, fontWeight: typography.fw7, color: colors.accent700 }}>AI</Text></View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
          <Text style={{ fontSize: typography.fz13, lineHeight: 20, color: isUser ? colors.white : colors.ink }}>{msg.text}</Text>
        </View>
        {isUser && (
          <View style={s.userAvatar}><Icon name="user" size={13} color={colors.accent700} /></View>
        )}
      </View>
      {!isUser && (
        <View style={{ flexDirection: 'row', gap: spacing.s8, marginLeft: 36, marginTop: spacing.s4 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.s8, paddingVertical: spacing.s4, borderRadius: radii.sm, borderWidth: 1, borderColor: fb === 'good' ? colors.accent : colors.hairline, backgroundColor: fb === 'good' ? colors.accent50 : 'transparent' }}
            onPress={() => setFb('good')}>
            <Text style={{ fontSize: typography.fz12 }}>👍</Text>
            <Text style={{ fontSize: typography.fz11, color: fb === 'good' ? colors.accent700 : colors.muted }}>도움됨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.s8, paddingVertical: spacing.s4, borderRadius: radii.sm, borderWidth: 1, borderColor: fb === 'bad' ? colors.danger : colors.hairline, backgroundColor: fb === 'bad' ? colors.danger50 : 'transparent' }}
            onPress={() => setFb('bad')}>
            <Text style={{ fontSize: typography.fz12 }}>👎</Text>
            <Text style={{ fontSize: typography.fz11, color: fb === 'bad' ? colors.danger : colors.muted }}>별로</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  safetyNotice: {
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.s16,
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.hairline,
  },
});

export default ChatSessionScreen;
