import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import ScreenLayout from '../../components/ScreenLayout';
import { Rule } from './_settingsShared';

export function PasswordChangeScreen({ navigation }: any) {
  const { flash } = useApp();
  const [cur, setCur] = useState('');
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const pwLengthOk = pw.length >= 8 && pw.length <= 20;
  const pwTypesOk  = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length >= 3;
  const matchOk    = !!pw && pw === pw2;
  const canSubmit  = !!cur && pwLengthOk && pwTypesOk && matchOk;

  return (
    <ScreenLayout title="비밀번호 변경" back onBack={() => navigation.goBack()} scrollable>
      <Card>
        {[
          { label: '현재 비밀번호', val: cur, set: setCur },
          { label: '새 비밀번호',  val: pw,  set: setPw },
          { label: '새 비밀번호 확인', val: pw2, set: setPw2 },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s8 }}>{f.label}</Text>
            <Input value={f.val} onChangeText={f.set} secureTextEntry />
          </View>
        ))}
        <View style={{ marginBottom: 14 }}>
          <Rule ok={pwLengthOk}>8자 이상 20자 이하</Rule>
          <Rule ok={pwTypesOk}>영문 대/소문자·숫자·특수문자 중 3종류 이상</Rule>
          <Rule ok={matchOk}>새 비밀번호와 확인이 일치</Rule>
        </View>
        <Button
          variant="primary"
          size="lg"
          style={{ borderRadius: radii.md, opacity: canSubmit ? 1 : 0.4 }}
          onPress={() => { flash('비밀번호가 변경되었어요'); navigation.goBack(); }}
          fullWidth
        >변경하기</Button>
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, marginTop: 14 }}>
        <Icon name="shield" size={16} color={colors.accent700} />
        <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, marginLeft: spacing.s8 }}>변경 후 다른 기기에서는 다시 로그인해야 해요.</Text>
      </View>
    </ScreenLayout>
  );
}

export default PasswordChangeScreen;
