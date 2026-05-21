import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { s } from './_ocrShared';

export function DrugDosageScreen({ navigation }: any) {
  const { flash, ocrSession, setOcrSession } = useApp();
  const [freq, setFreq] = useState('3회');
  const [time, setTime] = useState('식후 30분');
  const [duration, setDuration] = useState('14일');

  const save = () => {
    setOcrSession({
      ...ocrSession,
      drugs: ocrSession.drugs.map(d =>
        d.status === 'needsCheck'
          ? { ...d, status: 'ok', name: '메트포르민정 500mg', maker: 'A제약', time: `1일 ${freq} · ${time}`, confidence: 100 }
          : d
      ),
    });
    flash('복용법을 저장했어요');
    navigation.goBack();
  };

  const Section = ({ label, options, value, onChange }: any) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s8 }}>
        {options.map((o: string) => (
          <TouchableOpacity key={o} style={[s.chip, value === o && s.chipActive]} onPress={() => onChange(o)}>
            <Text style={[{ fontSize: typography.fz13 }, value === o && { color: colors.accent700, fontWeight: typography.fw6 }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title="복용법 입력"
      back
      onBack={() => navigation.goBack()}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s20 }}
    >
      <Text style={{ fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s20 }}>
        OCR 인식값이 자동으로 채워졌어요. 내용을 확인하고 필요시 수정해 주세요.
      </Text>

      <Card>
        <View style={[s.banner, s.bannerSuccess, { marginBottom: 14 }]}>
          <View style={[s.chip, { backgroundColor: colors.success }]}>
            <Text style={{ color: colors.white, fontSize: typography.fz11, fontWeight: typography.fw6 }}>선택됨</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>메트포르민정 500mg</Text>
            <Text style={{ fontSize: typography.fz12, color: '#065F46' }}>성분: Metformin | 제조사: A제약</Text>
          </View>
        </View>

        <View style={[s.banner, s.bannerWarn, { marginBottom: 20 }]}>
          <Icon name="alert" size={16} color={colors.warning} />
          <Text style={{ fontSize: typography.fz13, color: colors.ink2, flex: 1, marginLeft: spacing.s8 }}>
            아래 값은 OCR 자동 인식 결과입니다. 처방전과 다른 경우 직접 수정해 주세요.
          </Text>
        </View>

        <Section label="1일 복용 횟수" options={['1회', '2회', '3회', '4회']} value={freq} onChange={setFreq} />
        <Section label="복용 시간" options={['식전 30분', '식후 30분', '식전 즉시', '식후 즉시', '취침 전', '공복']} value={time} onChange={setTime} />
        <Section label="복용 기간" options={['7일', '14일', '30일', '60일', '90일', '장기복용']} value={duration} onChange={setDuration} />

        <Card style={{ backgroundColor: colors.surface2, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s16 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>입력 확인</Text>
            {[['횟수', freq], ['시간', time], ['기간', duration]].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', gap: 4, alignItems: 'baseline' }}>
                <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{k}</Text>
                <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button variant="primary" size="lg" style={{ borderRadius: radii.md }} onPress={save}>복용법 저장하기</Button>
      </Card>
    </ScreenLayout>
  );
}

export default DrugDosageScreen;
