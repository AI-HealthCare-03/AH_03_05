import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_guideShared';

export function GuideLoadingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const steps = ['처방전 데이터 정리', '건강 프로필과 매칭', '복약 시간표 계산', '주의사항 추론', '생활습관 체크리스트 생성'];

  useEffect(() => {
    // TODO: [BE 대기] POST /guides 백엔드 미구현 — 구현 완료 후 연결 필요
    // TODO: [BE 대기] GET /jobs/{job_id} 폴링으로 진행 단계 수신 — 구현 완료 후 연결 필요
    if (step >= steps.length) {
      const t = setTimeout(() => navigation.replace('GuideResult'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), 600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <ScreenLayout noHeader contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
      <Card style={{ width: '90%', alignItems: 'center' }}>
        <View style={s.spinner}>
          <Icon name="wand" size={36} color={colors.accent700} />
        </View>
        <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7, marginBottom: spacing.s4 }}>맞춤 가이드를 만들고 있어요</Text>
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20 }}>건강 프로필을 기준으로 분석 중입니다.</Text>

        <View style={[s.progressBg, { alignSelf: 'stretch', marginBottom: spacing.s20 }]}>
          <View style={[s.progressFill, { width: `${Math.min(100, (step + 1) / steps.length * 100)}%` as any }]} />
        </View>

        {steps.map((st, i) => (
          <View key={st} style={[s.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
            <View style={[s.stepDot, { backgroundColor: i < step ? colors.success : i === step ? colors.accent : colors.hairline }]}>
              {i < step
                ? <Icon name="check" size={12} color={colors.white} />
                : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === step ? colors.white : colors.muted2 }} />}
            </View>
            <Text style={{ fontSize: typography.fz13, flex: 1 }}>{st}</Text>
            {i === step && <Text style={{ fontSize: typography.fz12, color: colors.muted }}>처리 중...</Text>}
          </View>
        ))}
      </Card>
    </ScreenLayout>
  );
}

export default GuideLoadingScreen;
