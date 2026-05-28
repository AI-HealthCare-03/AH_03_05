import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ScreenLayout from '../../components/ScreenLayout';
import { s, Rule } from './_settingsShared';
import { usersApi, extractApiError } from '../../api';

export function PasswordChangeScreen({ navigation }: any) {
  const { flash } = useApp();
  const [cur, setCur] = useState('');
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pwLengthOk      = pw.length >= 8 && pw.length <= 20;
  const pwUpperOk       = /[A-Z]/.test(pw);
  const pwLowerOk       = /[a-z]/.test(pw);
  const pwNumberOk      = /[0-9]/.test(pw);
  const pwSpecialOk     = /[^A-Za-z0-9]/.test(pw);
  const matchOk         = !!pw && pw === pw2;
  const sameAsCurrent   = !!pw && !!cur && pw === cur;
  const canSubmit       = !!cur && pwLengthOk && pwUpperOk && pwLowerOk && pwNumberOk && pwSpecialOk && matchOk && !sameAsCurrent;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await usersApi.changePassword({ current_password: cur, new_password: pw });
      flash('비밀번호가 변경되었습니다.');
      navigation.goBack();
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;
      if (status === 400) {
        setError(detail ?? '현재 비밀번호가 일치하지 않습니다.');
      } else {
        setError(extractApiError(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="비밀번호 변경" back onBack={() => navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')} scrollable>
      <Card shadow>
        {[
          { label: '현재 비밀번호',    val: cur,  set: setCur,  autoComplete: 'current-password' as const },
          { label: '새 비밀번호',      val: pw,   set: setPw,   autoComplete: 'new-password'     as const },
          { label: '새 비밀번호 확인', val: pw2,  set: setPw2,  autoComplete: 'new-password'     as const },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Input label={f.label} value={f.val} onChangeText={f.set} secureTextEntry autoComplete={f.autoComplete} />
          </View>
        ))}
        <View style={{ marginBottom: 14 }}>
          <Rule ok={pwLengthOk}>8자 이상 20자 이하</Rule>
          <Rule ok={pwUpperOk && pwLowerOk && pwNumberOk && pwSpecialOk}>영문 대소문자·숫자·특수문자 포함</Rule>
          {pw2.length > 0 && <Rule ok={matchOk}>새 비밀번호와 확인 일치</Rule>}
          {pw.length > 0 && <Rule ok={!sameAsCurrent}>현재 비밀번호와 다름</Rule>}
        </View>
        {!!error && (
          <Text style={{ fontSize: typography.fz13, color: colors.danger, marginBottom: spacing.s12 }}>{error}</Text>
        )}
        <Button
          variant="primary"
          size="lg"
          borderRadius={radii.pill}
          disabled={!canSubmit}
          onPress={submit}
          loading={loading}
          fullWidth
        >변경하기</Button>
      </Card>
      <View style={[s.banner, { backgroundColor: colors.accent50, marginTop: 14 }]}>
        <Icon name="shield" size={16} color={colors.accent700} />
        <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: spacing.s8 }}>변경 후 다른 기기에서는 다시 로그인해야 해요.</Text>
      </View>
    </ScreenLayout>
  );
}

export default PasswordChangeScreen;
