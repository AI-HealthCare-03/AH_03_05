import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import { colors, spacing, typography } from '../../theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ChatSessionPane } from './ChatSessionPane';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<ChatStackParams, 'ChatSession'>;

const TAB_BAR_HEIGHT = 80;

export function ChatSessionScreen({ navigation, route }: Props) {
  const { top: safeTop } = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const sessionId: string | undefined = route?.params?.sessionId;
  const [sessionTitle, setSessionTitle] = React.useState(route?.params?.title ?? '상담');
  const sessionSubtitle: string | undefined = route?.params?.subtitle;

  if (!sessionId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: typography.fz14, color: colors.muted }}>
          상담 내역을 찾을 수 없어요.
        </Text>
      </View>
    );
  }

  // 공통: 헤더 + 세션 패널을 KAV 안에 배치
  const inner = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={TAB_BAR_HEIGHT}
    >
      <View
        style={[
          cs.header2,
          isDesktop && { paddingTop: Math.max(safeTop, spacing.safeTop) },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={cs.iconBtn} accessibilityLabel="뒤로가기" accessibilityRole="button">
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.s8 }}>
          <Text style={cs.sessionTitle} numberOfLines={1}>
            {sessionTitle}
          </Text>
          {sessionSubtitle ? (
            <Text style={cs.sessionSubtitle} numberOfLines={1}>
              {sessionSubtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <ChatSessionPane
        sessionId={sessionId}
        onFirstMessage={text => setSessionTitle(text.slice(0, 20))}
      />
    </KeyboardAvoidingView>
  );

  // 모바일: 카드 컨테이너에 좌우 여백 적용
  if (!isDesktop) {
    return (
      <View
        style={[cs.mobileCanvas, { paddingTop: Math.max(safeTop + spacing.s8, spacing.safeTop) }]}
      >
        <Card shadow noPadding style={cs.mobileCard}>
          {inner}
        </Card>
      </View>
    );
  }

  // 데스크탑: 기존 풀사이즈 레이아웃
  return <View style={{ flex: 1, backgroundColor: colors.canvas }}>{inner}</View>;
}

const cs = StyleSheet.create({
  header2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s16,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  sessionTitle: { fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink },
  sessionSubtitle: { fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 },
  mobileCanvas: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.s12,
    paddingBottom: spacing.s12,
  },
  mobileCard: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default ChatSessionScreen;
