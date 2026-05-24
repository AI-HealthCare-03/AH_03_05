import React from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import { ChatSessionPane } from './ChatSessionPane';

const TAB_BAR_HEIGHT = 80;

export function ChatSessionScreen({ navigation, route }: any) {
  const { top: safeTop } = useSafeAreaInsets();
  const sessionId: string | undefined = route?.params?.sessionId;

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
      <View style={[cs.header, { paddingTop: safeTop }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cs.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.s8 }}>
          <Text style={cs.title} numberOfLines={1}>건강 상담</Text>
        </View>
        <Button variant="ghost" size="sm" leftIcon="list" onPress={() => navigation.goBack()}>
          목록
        </Button>
      </View>

      <ChatSessionPane sessionId={sessionId} />
    </KeyboardAvoidingView>
  );
}

const cs = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: spacing.s16,
    backgroundColor: colors.canvas,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
});

export default ChatSessionScreen;
