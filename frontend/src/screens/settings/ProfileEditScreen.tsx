import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

export function ProfileEditScreen({ navigation }: any) {
  const { user, setUser, flash } = useApp();
  const [form, setForm] = useState({
    age: user.age || '40대', sex: user.sex || '여성',
    conditions: user.conditions || '', otherMeds: user.otherMeds || '',
    allergies: user.allergies || '', pregnant: user.pregnant || '아니오',
    smoking: user.smoking || '아니오', notes: user.notes || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const ages  = ['20대', '30대', '40대', '50대', '60대+'];
  const sexes = ['여성', '남성'];
  const yn    = ['예', '아니오'];

  const save = () => {
    // TODO: PUT /api/v1/health-profile 연동 필요
    // 백엔드 머지 확인 후 온보딩의 healthProfileApi.upsertHealthProfile() 패턴으로 교체
    setUser({ ...user, ...form, profileComplete: true });
    flash('저장했어요');
    navigation.goBack();
  };

  return (
    <ScreenLayout title="개인 정보 수정" back onBack={() => navigation.goBack()} scrollable>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, marginBottom: spacing.s20 }}>
          <Icon name="info" size={16} color={colors.accent700} />
          <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: spacing.s8 }}>입력할수록 더 개인화된 가이드를 받을 수 있어요.</Text>
        </View>

        {[
          { label: '연령대', key: 'age', options: ages },
          { label: '성별', key: 'sex', options: sexes },
          { label: '임신/수유 여부', key: 'pregnant', options: yn },
          { label: '음주/흡연', key: 'smoking', options: yn },
        ].map(f => (
          <View key={f.key} style={{ marginBottom: spacing.s16 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s8 }}>{f.label} <Text style={{ color: colors.muted, fontWeight: typography.fw4 }}>(선택)</Text></Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s8 }}>
              {f.options.map(o => (
                <TouchableOpacity key={o} style={[s.chip, form[f.key as keyof typeof form] === o && s.chipActive]} onPress={() => set(f.key, o)}>
                  <Text style={[{ fontSize: typography.fz13 }, form[f.key as keyof typeof form] === o && { color: colors.accent700, fontWeight: typography.fw6 }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {[
          { label: '기저질환', key: 'conditions' },
          { label: '현재 복용약 (처방전 외)', key: 'otherMeds' },
          { label: '알레르기', key: 'allergies' },
        ].map(f => (
          <View key={f.key} style={{ marginBottom: 14 }}>
            <Input
              label={`${f.label} (선택)`}
              value={form[f.key as keyof typeof form]}
              onChangeText={v => set(f.key, v)}
            />
          </View>
        ))}

        <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s8 }}>의사 소견 <Text style={{ color: colors.muted, fontWeight: typography.fw4 }}>(선택)</Text></Text>
        <TextInput style={[{ borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: spacing.s12, height: 80, fontSize: typography.fz14, color: colors.ink, backgroundColor: colors.surface }, { textAlignVertical: 'top' }]} multiline value={form.notes} onChangeText={v => set('notes', v)} />

        <Button variant="primary" size="lg" style={{ marginTop: spacing.s20, borderRadius: radii.md }} onPress={save} fullWidth>저장하기</Button>
      </Card>
    </ScreenLayout>
  );
}

export default ProfileEditScreen;
