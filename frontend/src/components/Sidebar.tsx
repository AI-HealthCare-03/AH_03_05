import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  useNavigation,
  useNavigationState,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import MediPTLogo from './MediPTLogo';
import { colors, spacing, radii, typography } from '../theme';

const TAB_ROOT_SCREENS: Record<string, string> = {
  HomeTab: 'Home',
  RecordsTab: 'RecordList',
  GuideTab: 'GuideResult',
  ChatTab: 'ChatList',
  SettingsTab: 'Settings',
};

const NAV_ITEMS = [
  {
    section: '메인',
    items: [
      { label: '홈 대시보드', icon: 'home', tab: 'HomeTab', screen: 'Home' },
      { label: '진료기록', icon: 'doc', tab: 'RecordsTab' },
      { label: '복약 가이드', icon: 'wand', tab: 'GuideTab' },
    ],
  },
  {
    section: '관리',
    items: [
      { label: '건강상담', icon: 'chat', tab: 'ChatTab' },
      { label: '설정', icon: 'settings', tab: 'SettingsTab' },
    ],
  },
];

export default function Sidebar() {
  const { user } = useApp();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const { activeTab } = useNavigationState(state => {
    try {
      const mainRoute = state.routes.find(r => r.name === 'Main');
      const mainState = mainRoute?.state;
      if (!mainState?.routes) return { activeTab: 'HomeTab' };
      const activeTabRoute = mainState.routes[mainState.index ?? 0];
      return { activeTab: activeTabRoute?.name ?? 'HomeTab' };
    } catch {
      return { activeTab: 'HomeTab' };
    }
  });

  const isItemActive = (item: { tab: string; screen?: string }) => item.tab === activeTab;

  const go = (tab: string, screen?: string) => {
    (navigation as unknown as { navigate: (tab: string, params?: object) => void }).navigate(tab, {
      screen: screen ?? TAB_ROOT_SCREENS[tab],
    });
  };

  return (
    <View style={s.sidebar}>
      {/* 브랜드 */}
      <TouchableOpacity style={s.brand} onPress={() => go('HomeTab', 'Home')} activeOpacity={0.7}>
        <MediPTLogo width={130} />
      </TouchableOpacity>

      {/* 메뉴 */}
      <View style={{ flex: 1 }}>
        {NAV_ITEMS.map(sec => (
          <View key={sec.section} style={{ marginBottom: spacing.s20 }}>
            <Text style={s.sectionLabel}>{sec.section}</Text>
            {sec.items.map(item => {
              const isActive = isItemActive(item);
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[s.navItem, isActive && s.navItemActive]}
                  onPress={() => go(item.tab, item.screen)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    color={isActive ? colors.accent700 : colors.muted}
                  />
                  <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* 유저 */}
      <TouchableOpacity style={s.userRow} onPress={() => go('SettingsTab')} activeOpacity={0.8}>
        <View style={s.avatar}>
          <Icon name="user" size={16} color={colors.ink2} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.s10 }}>
          <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }} numberOfLines={1}>
            {user.nickname || user.name}
          </Text>
          <Text style={{ fontSize: typography.fz11, color: colors.muted }} numberOfLines={1}>
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
    paddingTop: spacing.s20,
    paddingBottom: spacing.s16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s8,
    marginBottom: spacing.s24,
    paddingHorizontal: spacing.s4,
  },
  sectionLabel: {
    fontSize: typography.fz11,
    fontWeight: typography.fw6,
    color: colors.muted,
    letterSpacing: typography.ls05,
    paddingHorizontal: spacing.s8,
    marginBottom: spacing.s4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s10,
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.s9,
    borderRadius: radii.md,
    marginBottom: spacing.s2,
  },
  navItemActive: { backgroundColor: colors.accent50 },
  navLabel: { fontSize: typography.fz13, fontWeight: typography.fw5, color: colors.muted },
  navLabelActive: { color: colors.accent700, fontWeight: typography.fw6 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s8,
    paddingVertical: spacing.s10,
    borderRadius: radii.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.hairline,
    marginTop: spacing.s8,
    paddingTop: spacing.s16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
