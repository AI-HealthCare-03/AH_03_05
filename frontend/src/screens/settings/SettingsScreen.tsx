import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import type { RootStackParams } from '../../navigation/types';
import { useApp, defaultUser } from '../../context/AppContext';
import { authApi, usersApi } from '../../api';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

const MENU_SECTIONS: { icon: string; label: string; to: string; params?: Record<string, string> }[][] = [
  [
    { icon: 'wand', label: '건강 프로필', to: 'HealthProfileEdit' },
    { icon: 'bell', label: '알림 설정', to: 'NotificationSettings' },
  ],
  [
    { icon: 'lock', label: '비밀번호 변경', to: 'PasswordChange' },
    { icon: 'device', label: '로그인 기기 관리', to: 'DeviceManagement' },
  ],
  [
    { icon: 'list', label: '약관 동의 내역', to: 'ConsentHistory' },
  ],
];

type MenuItemProps = {
  icon: string;
  label: string;
  to: string;
  params?: Record<string, string>;
  isFirst: boolean;
  navigation: any;
};

function MenuItem({ icon, label, to, params, isFirst, navigation }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[s.rowItem, !isFirst && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
      onPress={() => navigation.navigate(to, params)}
    >
      <Icon name={icon} size={16} color={colors.accent700} />
      <Text style={s.rowLabel}>{label}</Text>
      <Icon name="chevron-right" size={14} color={colors.muted2} />
    </TouchableOpacity>
  );
}

export function SettingsScreen({ navigation }: any) {
  const { user, setUser, flash } = useApp();
  const [loading, setLoading] = useState(true);
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await usersApi.getMe();
        if (!mounted) return;
        setUser({
          ...user,
          name: info.name,
          nickname: info.nickname ?? info.name,
          email: info.email,
        });
      } catch (err: any) {
        if (!mounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          await authApi.logout().catch(() => {});
          await AsyncStorage.setItem('medipt_user', JSON.stringify({ ...defaultUser, loggedIn: false }));
          setUser({ ...defaultUser, loggedIn: false });
          (navigation.getParent()?.getParent() as NavigationProp<RootStackParams> | undefined)
            ?.reset({ index: 0, routes: [{ name: 'Auth' }] });
          return;
        }
        console.error('[Settings] getMe 실패 — AppContext 데이터 사용:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ScreenLayout
      title="설정"
      subtitle="알림 · 보안 · 약관 · 계정 정보를 관리해요."
      scrollable
    >
      {/* Profile card */}
      <Card shadow style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12 }}>
          <View style={s.avatar}><Icon name="user" size={20} color={colors.ink2} /></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 26 }}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : nicknameEdit ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8 }}>
                    <TextInput
                      style={ss.nicknameInput}
                      value={nicknameValue}
                      onChangeText={setNicknameValue}
                      autoFocus
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={async () => {
                        if (!nicknameValue.trim()) { flash('닉네임을 입력해주세요'); return; }
                        try {
                          const updated = await usersApi.updateMe({ nickname: nicknameValue });
                          setUser({ ...user, nickname: updated.nickname ?? nicknameValue });
                          flash('닉네임을 저장했어요');
                        } catch {
                          flash('저장에 실패했어요');
                        }
                        setNicknameEdit(false);
                      }}
                    >저장</Button>
                    <Button variant="ghost" size="sm" onPress={() => setNicknameEdit(false)}>취소</Button>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => { setNicknameValue(user.nickname || user.name); setNicknameEdit(true); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8 }}
                  >
                    <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7 }}>{user.nickname || user.name}</Text>
                    <Icon name="edit" size={14} color={colors.muted2} />
                  </TouchableOpacity>
                )}
              </View>
              {!loading && !nicknameEdit && (
                <Button variant="ghost" size="sm" onPress={() => navigation.navigate('HealthProfileEdit')}>건강 프로필 수정</Button>
              )}
            </View>
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{user.email}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.s8, marginTop: spacing.s12 }}>
          <View style={s.chip}>
            <Text style={{ fontSize: typography.fz12, color: user.profileComplete ? colors.success : colors.muted }}>
              {user.profileComplete ? '건강정보 입력 완료' : '건강정보 미입력'}
            </Text>
          </View>
          <View style={s.chip}>
            <Text style={{ fontSize: typography.fz12, color: colors.ink2 }}>
              {user.age || '—'} · {user.sex || '—'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Sections */}
      {MENU_SECTIONS.map((sec, si) => (
        <Card key={si} shadow noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
          {sec.map((it, ji) => (
            <MenuItem
              key={it.label}
              icon={it.icon}
              label={it.label}
              to={it.to}
              params={it.params}
              isFirst={ji === 0}
              navigation={navigation}
            />
          ))}
        </Card>
      ))}

      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: 22 }}>
        <TouchableOpacity
          style={s.rowItem}
          onPress={async () => {
            await authApi.logout().catch(() => {});
            const rawFlags = await AsyncStorage.getItem('medipt_profile_flags').catch(() => null);
            const profileFlags: Record<string, boolean> = rawFlags ? JSON.parse(rawFlags) : {};
            profileFlags[user.email] = user.profileComplete;
            await AsyncStorage.setItem('medipt_profile_flags', JSON.stringify(profileFlags));
            await AsyncStorage.removeItem('medipt_user');
            setUser({ ...defaultUser });
            (navigation.getParent()?.getParent() as NavigationProp<RootStackParams> | undefined)?.reset({ index: 0, routes: [{ name: 'Auth' }] });
            flash('로그아웃 되었어요');
          }}
        >
          <Icon name="logout" size={16} color={colors.ink2} />
          <Text style={s.rowLabel}>로그아웃</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
          onPress={() => navigation.navigate('DeleteAccount')}
        >
          <Icon name="trash" size={16} color={colors.danger} />
          <Text style={[s.rowLabel, { color: colors.danger }]}>회원 탈퇴</Text>
        </TouchableOpacity>
      </Card>

      <Text style={{ fontSize: typography.fz12, color: colors.muted, textAlign: 'center' }}>
        본 서비스는 의료 행위를 대체하지 않으며, 참고 정보를 제공합니다.
      </Text>
    </ScreenLayout>
  );
}

export default SettingsScreen;

const ss = StyleSheet.create({
  nicknameInput: {
    flex: 1,
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 2,
    color: colors.ink,
  },
});
