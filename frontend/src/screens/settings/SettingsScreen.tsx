import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { SettingsStackParams } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavProp = NativeStackNavigationProp<SettingsStackParams, 'Settings'>;
import { useApp, defaultUser } from '../../context/AppContext';
import { authApi, usersApi, extractApiError } from '../../api';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import IconCircle from '../../components/IconCircle';
import MenuItem from '../../components/MenuItem';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

const MENU_SECTIONS: { icon: string; label: string; to: keyof SettingsStackParams }[][] = [
  [
    { icon: 'wand', label: '건강 프로필', to: 'HealthProfileEdit' },
    { icon: 'list', label: '건강 프로필 변경 이력', to: 'HealthProfileHistory' },
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

export function SettingsScreen({ navigation }: { navigation: NavProp }) {
  const { user, setUser, flash } = useApp();
  const [loading, setLoading] = useState(true);
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  // ',' 나 공백만 든 비정상 값은 split·filter 후 빈 배열 → 미입력으로 처리(빈 줄 방지)
  const conditionChips = (user.conditions ?? '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean)
    .slice(0, 4);

  useFocusEffect(
    useCallback(() => {
      return () => setNicknameEdit(false);
    }, [])
  );

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
          await AsyncStorage.setItem(
            'medipt_user',
            JSON.stringify({ ...defaultUser, loggedIn: false })
          );
          setUser({ ...defaultUser, loggedIn: false });
          // loggedIn=false 전환 시 AppNavigator가 자동으로 Auth로 스왑
          return;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenLayout title="설정" subtitle="알림 · 보안 · 약관 · 계정 정보를 관리해요." scrollable>
      {/* Profile card */}
      <Card shadow style={{ marginBottom: spacing.s14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12 }}>
          <IconCircle
            size={44}
            icon="user"
            iconSize={20}
            color={colors.ink2}
            backgroundColor={colors.surface2}
            borderColor={colors.hairline}
          />
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
                      accessibilityLabel="닉네임 입력"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      loading={nicknameSaving}
                      onPress={async () => {
                        if (!nicknameValue.trim()) {
                          flash('닉네임을 입력해주세요');
                          return;
                        }
                        const trimmed = nicknameValue.trim();
                        if (!/^[가-힣a-zA-Z0-9]{2,20}$/.test(trimmed)) {
                          flash('닉네임은 2~20자, 한글/영문/숫자만 가능합니다');
                          return;
                        }
                        setNicknameSaving(true);
                        try {
                          const updated = await usersApi.updateMe({
                            nickname: trimmed,
                          });
                          setUser({ ...user, nickname: updated.nickname ?? trimmed });
                          flash('닉네임이 변경되었습니다');
                          setNicknameEdit(false);
                        } catch (e: any) {
                          const data = e?.response?.data;
                          if (data?.error_code === 'NICKNAME_CHANGE_TOO_SOON') {
                            flash('닉네임은 30일마다 변경할 수 있습니다');
                          } else if (
                            e?.response?.status === 400 &&
                            typeof data?.detail === 'string'
                          ) {
                            flash(data.detail);
                          } else {
                            flash(extractApiError(e));
                          }
                        } finally {
                          setNicknameSaving(false);
                        }
                      }}
                    >
                      저장
                    </Button>
                    <Button variant="ghost" size="sm" onPress={() => setNicknameEdit(false)}>
                      취소
                    </Button>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setNicknameValue(user.nickname || user.name);
                      setNicknameEdit(true);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.s8,
                      alignSelf: 'flex-start',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="닉네임 편집"
                  >
                    <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7 }}>
                      {user.nickname || user.name}
                    </Text>
                    <Icon name="edit" size={14} color={colors.muted2} />
                  </TouchableOpacity>
                )}
              </View>
              {!loading && !nicknameEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate('HealthProfileEdit')}
                >
                  건강 프로필 수정
                </Button>
              )}
            </View>
            {!loading && user.name ? (
              <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 }}>
                이름 · {user.name}
              </Text>
            ) : null}
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 }}>
              {user.email}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.s8,
            marginTop: spacing.s12,
          }}
        >
          {/* 홈과 동일 모델: 기저질환 칩 노출, 미입력 시 안내 칩 */}
          {conditionChips.length > 0 ? (
            conditionChips.map(c => (
              <View key={c} style={s.chip}>
                <Text style={{ fontSize: typography.fz12, color: colors.ink2 }}>{c}</Text>
              </View>
            ))
          ) : (
            <View style={s.chip}>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>
                건강정보 미입력
              </Text>
            </View>
          )}
          <View style={s.chip}>
            <Text style={{ fontSize: typography.fz12, color: colors.ink2 }}>
              {user.age || '—'} · {user.sex || '—'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Sections */}
      {MENU_SECTIONS.map((sec, si) => (
        <Card key={si} shadow noPadding style={{ overflow: 'hidden', marginBottom: spacing.s14 }}>
          {sec.map((it, ji) => (
            <MenuItem
              key={it.label}
              icon={it.icon}
              label={it.label}
              onPress={() => navigation.navigate(it.to)}
              separator={ji > 0}
            />
          ))}
        </Card>
      ))}

      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: spacing.s22 }}>
        <MenuItem
          icon="logout"
          label="로그아웃"
          iconColor={colors.ink2}
          chevron={false}
          onPress={async () => {
            await authApi.logout().catch(() => {});
            const rawFlags = await AsyncStorage.getItem('medipt_profile_flags').catch(() => null);
            const profileFlags: Record<string, boolean> = rawFlags ? JSON.parse(rawFlags) : {};
            profileFlags[user.email] = user.profileComplete;
            await AsyncStorage.setItem('medipt_profile_flags', JSON.stringify(profileFlags));
            await AsyncStorage.removeItem('medipt_user');
            setUser({ ...defaultUser });
            // loggedIn=false 전환 시 AppNavigator가 자동으로 Auth로 스왑
            flash('로그아웃 되었어요');
          }}
        />
        <MenuItem
          icon="trash"
          label="회원 탈퇴"
          iconColor={colors.danger}
          labelColor={colors.danger}
          chevron={false}
          separator
          onPress={() => navigation.navigate('DeleteAccount')}
        />
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
    paddingVertical: spacing.s2,
    color: colors.ink,
  },
});
