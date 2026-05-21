import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useApp, Chat } from "../../context/AppContext";
import Icon from "../../components/Icon";
import { colors, spacing, typography } from "../../theme";
import Button from "../../components/Button";
import ScreenLayout from "../../components/ScreenLayout";
import { s } from "./_chatShared";

export function ChatListScreen({ navigation }: any) {
  const { chats, setChats } = useApp();
  const [query, setQuery] = useState("");
  const filtered = chats.filter((c) => !query || c.title.includes(query) || c.preview.includes(query));

  const startNew = () => {
    const newId = "c" + Date.now();
    const newChat: Chat = { id: newId, title: "새 상담", preview: "", time: "방금", messages: [] };
    setChats([newChat, ...chats]);
    navigation.navigate("ChatSession", { chatId: newId });
  };

  return (
    <ScreenLayout
      title="상담 목록"
      right={
        <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>
          새 상담
        </Button>
      }
      headerExtra={
        <View style={s.searchBox}>
          <Icon name="search" size={14} color={colors.muted} />
          <TextInput style={{ flex: 1, fontSize: typography.fz14, color: colors.ink, marginLeft: spacing.s8, height: 36 }} placeholder="검색" value={query} onChangeText={setQuery} />
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ padding: spacing.s8 }}>
        {chats.length === 0 ? (
          <View style={{ alignItems: "center", padding: 48 }}>
            <Icon name="chat" size={36} color={colors.muted2} />
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink, marginTop: 14, marginBottom: 6 }}>아직 상담 내역이 없어요</Text>
            <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20, textAlign: "center" }}>복약·생활습관 관련 궁금한 점을 물어보세요.</Text>
            <Button variant="primary" size="sm" leftIcon="plus" onPress={startNew}>
              + 새 상담 시작하기
            </Button>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: "center", padding: spacing.s24 }}>검색 결과가 없어요</Text>
        ) : (
          filtered.map((c) => (
            <TouchableOpacity key={c.id} style={s.chatItem} onPress={() => navigation.navigate("ChatSession", { chatId: c.id })}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={{ fontSize: typography.fz11, color: colors.muted, marginLeft: spacing.s8 }}>{c.time}</Text>
                </View>
                <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                  {c.preview}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

export default ChatListScreen;
