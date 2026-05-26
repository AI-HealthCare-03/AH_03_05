import React from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import { ChatSessionPane } from './ChatSessionPane';

const TAB_BAR_HEIGHT = 80;

export function ChatSessionScreen({ navigation, route }: any) {
  const { top: safeTop } = useSafeAreaInsets();
  const sessionId: string | undefined = route?.params?.sessionId;
  const sessionTitle: string = route?.params?.title ?? '상담';

  if (!sessionId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: typography.fz14, color: colors.muted }}>상담 내역을 찾을 수 없어요.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={TAB_BAR_HEIGHT}
    >
      {/* 1단: 건강 상담 */}
      <View style={[cs.header1, { paddingTop: Math.max(safeTop, spacing.safeTop) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cs.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <Text style={[cs.title, { marginLeft: spacing.s8 }]} numberOfLines={1}>건강 상담</Text>
      </View>

      {/* 2단: 세션 제목 + 서브타이틀 */}
      <View style={cs.header2}>
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={cs.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.s8 }}>
          <Text style={cs.sessionTitle} numberOfLines={1}>{sessionTitle}</Text>
          <Text style={cs.sessionSubtitle}>복약 가이드와 내 정보를 참고해 답변해요</Text>
        </View>
      </View>

      <ChatSessionPane sessionId={sessionId} />
    </KeyboardAvoidingView>
  );
}

const cs = StyleSheet.create({
  header1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: spacing.s16,
    backgroundColor: colors.canvas,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  header2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s16,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  iconBtn:        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  sessionTitle:   { fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink },
  sessionSubtitle:{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 },
});

export default ChatSessionScreen;
