import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useNavigationState, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import Icon from "./Icon";
import MediPTLogo from "./MediPTLogo";
import { colors, spacing, radii } from "../theme";

const TAB_ROOT_SCREENS: Record<string, string> = {
  HomeTab: "Home",
  RecordsTab: "RecordList",
  GuideTab: "GuideResult",
  ChatTab: "ChatList",
  SettingsTab: "Settings",
};

const NAV_ITEMS = [
  {
    section: "메인",
    items: [
      { label: "홈 대시보드", icon: "home", tab: "HomeTab", screen: "Home" },
      { label: "진료기록", icon: "doc", tab: "RecordsTab" },
      { label: "복약 가이드", icon: "wand", tab: "GuideTab" },
    ],
  },
  {
    section: "관리",
    items: [
      { label: "건강상담", icon: "chat", tab: "ChatTab" },
      { label: "설정", icon: "settings", tab: "SettingsTab" },
    ],
  },
];

export default function Sidebar() {
  const { user } = useApp();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const { activeTab, activeScreen } = useNavigationState((state) => {
    try {
      const mainRoute = state.routes.find((r) => r.name === "Main");
      const mainState = mainRoute?.state;
      if (!mainState?.routes) return { activeTab: "HomeTab", activeScreen: undefined };
      const activeTabRoute = mainState.routes[mainState.index ?? 0];
      const tabState = (activeTabRoute as any)?.state;
      const screenRoute = tabState?.routes?.[tabState?.index ?? 0];
      return {
        activeTab: activeTabRoute?.name ?? "HomeTab",
        activeScreen: screenRoute?.name as string | undefined,
      };
    } catch {
      return { activeTab: "HomeTab", activeScreen: undefined };
    }
  });

  const isItemActive = (item: { tab: string; screen?: string }) => item.tab === activeTab;

  const go = (tab: string, screen?: string) => {
    (navigation as unknown as { navigate: (tab: string, params?: object) => void }).navigate(tab, { screen: screen ?? TAB_ROOT_SCREENS[tab] });
  };

  return (
    <View style={s.sidebar}>
      {/* 브랜드 */}
      <TouchableOpacity style={s.brand} onPress={() => go("HomeTab", "Home")} activeOpacity={0.7}>
        <MediPTLogo width={130} />
      </TouchableOpacity>

      {/* 메뉴 */}
      <View style={{ flex: 1 }}>
        {NAV_ITEMS.map((sec) => (
          <View key={sec.section} style={{ marginBottom: spacing.s20 }}>
            <Text style={s.sectionLabel}>{sec.section}</Text>
            {sec.items.map((item) => {
              const isActive = isItemActive(item);
              return (
                <TouchableOpacity key={item.label} style={[s.navItem, isActive && s.navItemActive]} onPress={() => go(item.tab, item.screen)} activeOpacity={0.7}>
                  <Icon name={item.icon} size={16} color={isActive ? colors.accent700 : colors.muted} />
                  <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* 유저 */}
      <TouchableOpacity style={s.userRow} onPress={() => go("SettingsTab")} activeOpacity={0.8}>
        <View style={s.avatar}>
          <Icon name="user" size={16} color={colors.ink2} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }} numberOfLines={1}>
            {user.nickname || user.name}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 200,
    backgroundColor: colors.surface,
    borderRightWidth: 0.5,
    borderRightColor: colors.hairline,
    paddingHorizontal: spacing.s16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.s24,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: radii.md,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: colors.accent50 },
  navLabel: { fontSize: 13, fontWeight: "500", color: colors.muted },
  navLabelActive: { color: colors.accent700, fontWeight: "600" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.hairline,
    marginTop: 8,
    paddingTop: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
});
