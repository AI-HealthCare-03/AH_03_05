import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import type { RootStackParams } from '../../navigation/types';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

export function SettingsScreen({ navigation }: any) {
  const { user, flash } = useApp();

  return (
    <ScreenLayout
      title="설정"
      subtitle="알림 · 보안 · 약관 · 계정 정보를 관리해요."
      scrollable
    >
      {/* Profile card */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12 }}>
            <View style={s.avatar}><Icon name="user" size={20} color={colors.ink2} /></View>
            <View>
              <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7 }}>{user.name}</Text>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{user.email}</Text>
            </View>
          </View>
          <Button variant="ghost" size="sm" onPress={() => navigation.navigate('ProfileEdit')}>내 정보</Button>
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
      {[
        [
          { icon: 'wand', label: '건강 프로필', to: 'ProfileEdit' },
          { icon: 'bell', label: '알림 설정', to: 'NotificationSettings' },
        ],
        [
          { icon: 'lock', label: '비밀번호 변경', to: 'PasswordChange' },
          { icon: 'device', label: '로그인 기기 관리', to: 'DeviceManagement' },
        ],
        [
          { icon: 'list', label: '약관 동의 내역', to: 'ConsentHistory' },
          { icon: 'list', label: '서비스 이용약관', to: 'LegalDoc', params: { docKey: 'tos' } },
          { icon: 'list', label: '개인정보 처리방침', to: 'LegalDoc', params: { docKey: 'privacy' } },
          { icon: 'list', label: '민감 건강정보 수집 · 이용 동의 내역', to: 'LegalDoc', params: { docKey: 'sensitive' } },
        ],
      ].map((sec, si) => (
        <Card key={si} noPadding style={{ overflow: 'hidden', marginBottom: 14 }}>
          {sec.map((it: any, ji) => (
            <TouchableOpacity key={it.label} style={[s.rowItem, ji > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
              onPress={() => navigation.navigate(it.to, it.params)}>
              <Icon name={it.icon} size={16} color={colors.accent700} />
              <Text style={s.rowLabel}>{it.label}</Text>
              <Icon name="chevron-right" size={14} color={colors.muted2} />
            </TouchableOpacity>
          ))}
        </Card>
      ))}

      <Card noPadding style={{ overflow: 'hidden', marginBottom: 22 }}>
        <TouchableOpacity style={s.rowItem} onPress={() => { (navigation.getParent()?.getParent() as NavigationProp<RootStackParams> | undefined)?.reset({ index: 0, routes: [{ name: 'Auth' }] }); flash('로그아웃 되었어요'); }}>
          <Icon name="logout" size={16} color={colors.ink2} />
          <Text style={s.rowLabel}>로그아웃</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.rowItem, { borderTopWidth: 0.5, borderTopColor: colors.hairline }]} onPress={() => navigation.navigate('DeleteAccount')}>
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
