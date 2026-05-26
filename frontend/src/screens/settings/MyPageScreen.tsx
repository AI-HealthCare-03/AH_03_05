import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import type { RootStackParams } from '../../navigation/types';
import { useApp, defaultUser } from '../../context/AppContext';
import { usersApi, authApi } from '../../api';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

const MENU_SECTIONS = [
  [
    { icon: 'wand',     label: '건강정보 수정',     to: 'ProfileEdit' },
    { icon: 'bell',     label: '알림 설정',         to: 'NotificationSettings' },
  ],
  [
    { icon: 'lock',     label: '비밀번호 변경',     to: 'PasswordChange' },
    { icon: 'list',     label: '약관 동의 내역',     to: 'ConsentHistory' },
  ],
  [
    { icon: 'trash',    label: '회원탈퇴',           to: 'DeleteAccount', danger: true },
  ],
];

type MenuRowProps = {
  icon: string;
  label: string;
  danger?: boolean;
  isFirst: boolean;
  onPress: () => void;
};

function MenuRow({ icon, label, danger, isFirst, onPress }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[s.rowItem, !isFirst && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
      onPress={onPress}
    >
      <Icon name={icon} size={16} color={danger ? colors.danger : colors.accent700} />
      <Text style={[s.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Icon name="chevron-right" size={14} color={colors.muted2} />
    </TouchableOpacity>
  );
}

export function MyPageScreen({ navigation }: any) {
  const { user, setUser, flash } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const info = await usersApi.getMe();
        setUser({
          ...user,
          name: info.name,
          nickname: info.nickname ?? info.name,
          email: info.email,
        });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          await authApi.logout().catch(() => {});
          await AsyncStorage.setItem('medipt_user', JSON.stringify({ ...defaultUser, loggedIn: false }));
          setUser({ ...defaultUser, loggedIn: false });
          (navigation.getParent()?.getParent() as NavigationProp<RootStackParams> | undefined)
            ?.reset({ index: 0, routes: [{ name: 'Auth' }] });
          return;
        }
        console.error('[MyPage] getMe 실패 — AppContext 데이터 사용:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    const rawFlags = await AsyncStorage.getItem('medipt_profile_flags').catch(() => null);
    const profileFlags: Record<string, boolean> = rawFlags ? JSON.parse(rawFlags) : {};
    profileFlags[user.email] = user.profileComplete;
    await AsyncStorage.setItem('medipt_profile_flags', JSON.stringify(profileFlags));
    await AsyncStorage.removeItem('medipt_user');
    setUser({ ...defaultUser });
    (navigation.getParent()?.getParent() as NavigationProp<RootStackParams> | undefined)
      ?.reset({ index: 0, routes: [{ name: 'Auth' }] });
    flash('로그아웃 되었어요');
  };

  return (
    <ScreenLayout title="내 정보" back onBack={() => navigation.goBack()} scrollable>
      {/* 프로필 카드 */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12 }}>
          <View style={s.avatar}><Icon name="user" size={20} color={colors.ink2} /></View>
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <>
                <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink }}>
                  {user.nickname || user.name}
                </Text>
                <Text style={{ fontSize: typography.fz13, color: colors.muted }}>{user.email}</Text>
              </>
            )}
          </View>
        </View>
      </Card>

      {MENU_SECTIONS.map((sec, si) => (
        <Card key={si} noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
          {sec.map((it, ji) => (
            <MenuRow
              key={it.label}
              icon={it.icon}
              label={it.label}
              danger={it.danger}
              isFirst={ji === 0}
              onPress={() => navigation.navigate(it.to)}
            />
          ))}
        </Card>
      ))}

      <Card noPadding style={{ overflow: 'hidden', marginBottom: 22 }}>
        <MenuRow
          icon="logout"
          label="로그아웃"
          isFirst
          onPress={handleLogout}
        />
      </Card>
    </ScreenLayout>
  );
}

export default MyPageScreen;
