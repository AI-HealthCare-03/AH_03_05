import React from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import { ChatSessionPane } from './ChatSessionPane';

export function ChatSessionScreen({ navigation, route }: any) {
  const { chats } = useApp();
  const chatId: string | undefined = route?.params?.chatId;
  const chat = chats.find(c => c.id === chatId);

  if (!chatId || !chat) {
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
      keyboardVerticalOffset={0}
    >
      <View style={cs.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cs.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.s8 }}>
          <Text style={cs.title} numberOfLines={1}>{chat.title}</Text>
          {!!chat.preview && (
            <Text style={cs.subtitle} numberOfLines={1}>{chat.preview}</Text>
          )}
        </View>
        <Button variant="ghost" size="sm" leftIcon="list" onPress={() => navigation.goBack()}>
          목록
        </Button>
      </View>

      <ChatSessionPane chatId={chatId} />
    </KeyboardAvoidingView>
  );
}

const cs = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.safeTop,
    paddingBottom: 14,
    paddingHorizontal: spacing.s16,
    backgroundColor: colors.canvas,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.fz13,
    color: colors.muted,
    marginTop: 1,
  },
});

export default ChatSessionScreen;
