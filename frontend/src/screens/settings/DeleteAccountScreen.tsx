import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import type { RootStackParams } from '../../navigation/types';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';
import { usersApi, tokenStore, extractApiError } from '../../api';

const DELETE_ITEMS = [
  '건강 프로필 (기저질환, 알레르기, 복용약)',
  '업로드한 처방전·약봉투·진료기록 4건',
  'AI 상담 기록 3건',
  '생성된 복약 가이드 및 알림 설정',
];

const ss = StyleSheet.create({
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.hairlineStrong, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkBoxActive: { borderColor: colors.accent, backgroundColor: colors.accent },
});

type CheckRowProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

function CheckRow({ label, checked, onToggle }: CheckRowProps) {
  return (
    <TouchableOpacity style={ss.checkRow} onPress={onToggle}>
      <View style={[ss.checkBox, checked && ss.checkBoxActive]}>
        {checked && <Icon name="check" size={11} color={colors.white} />}
      </View>
      <Text style={{ fontSize: typography.fz13, color: colors.ink2, flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function DeleteAccountScreen({ navigation }: any) {
  const { user, flash } = useApp();
  const [step, setStep] = useState(1);
  const [checked, setChecked] = useState({ data: false, irreversible: false, alt: false });
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const allChecked = checked.data && checked.irreversible && checked.alt;
  const confirmOk  = confirm.trim().length > 0;

  const proceed = async () => {
    if (step === 1 && allChecked) { setStep(2); return; }
    if (step === 2 && confirmOk) {
      setLoading(true);
      setError('');
      try {
        await usersApi.deleteAccount(confirm);
        await tokenStore.clear();
        flash('탈퇴 처리가 완료됐어요. 안녕히 가세요 👋');
        (navigation.getParent()?.getParent() as NavigationProp<RootStackParams> | undefined)
          ?.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } catch (e: any) {
        setError(extractApiError(e));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScreenLayout title="회원 탈퇴" back onBack={() => navigation.goBack()} scrollable>
      <View style={[s.banner, s.bannerDanger, { marginBottom: 18 }]}>
        <Icon name="alert" size={16} color={colors.danger} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontWeight: typography.fw7, color: colors.danger }}>탈퇴하면 복구할 수 없어요</Text>
          <Text style={{ fontSize: typography.fz12, color: colors.ink2, marginTop: 2 }}>아래 내용을 꼭 확인해주세요.</Text>
        </View>
      </View>

      <Card shadow>
        {step === 1 ? (
          <>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, marginBottom: spacing.s12 }}>탈퇴 시 삭제되는 정보</Text>
            {['건강 프로필 (기저질환, 알레르기, 복용약)', '업로드한 처방전·약봉투·진료기록 4건', 'AI 상담 기록 3건', '생성된 복약 가이드 및 알림 설정'].map((item, i) => (
              <Text key={i} style={{ fontSize: typography.fz14, color: colors.ink2, marginBottom: spacing.s4 }}>• {item}</Text>
            ))}
            <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: spacing.s16 }} />
            <CheckRow checked={checked.data} label="모든 건강 데이터가 영구 삭제되는 점에 동의합니다." onToggle={() => setChecked(p => ({ ...p, data: !p.data }))} />
            <CheckRow checked={checked.irreversible} label="탈퇴 후에는 복구할 수 없다는 점을 이해했습니다." onToggle={() => setChecked(p => ({ ...p, irreversible: !p.irreversible }))} />
            <CheckRow checked={checked.alt} label="복약 정보 보관이 필요하다면 데이터 내보내기 후 탈퇴할 수 있다는 점을 알고 있습니다." onToggle={() => setChecked(p => ({ ...p, alt: !p.alt }))} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, marginBottom: spacing.s8 }}>최종 확인</Text>
            <Text style={{ fontSize: typography.fz13, color: colors.ink2, marginBottom: 14 }}>
              정말로 탈퇴하시려면 현재 비밀번호를 입력해주세요.
            </Text>
            <Input placeholder="비밀번호" value={confirm} onChangeText={v => { setConfirm(v); setError(''); }} secureTextEntry error={error || undefined} />
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 10 }}>{user.email || '이 계정'}이 삭제됩니다.</Text>
          </>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.s12, marginTop: spacing.s16 }}>
        <Button
          variant="ghost"
          size="lg"
          style={{ flex: 1 }}
          borderRadius={radii.pill}
          disabled={loading}
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
        >{step === 2 ? '이전' : '취소'}</Button>
        <Button
          variant="danger"
          size="lg"
          style={{ flex: 1 }}
          borderRadius={radii.pill}
          disabled={step === 1 ? !allChecked : !confirmOk}
          loading={loading}
          onPress={proceed}
        >{step === 1 ? '다음' : '탈퇴하기'}</Button>
      </View>
    </ScreenLayout>
  );
}

export default DeleteAccountScreen;
