import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, spacing, typography } from '../../theme';
import { ocrApi, jobsApi, extractApiError } from '../../api';
import { s } from './_ocrShared';

export function OCRProcessingScreen({ navigation, route }: any) {
  const recordId: number | undefined = route?.params?.recordId;
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const spinAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    { label: '이미지 보정', icon: 'image' },
    { label: '텍스트 인식', icon: 'scan' },
    { label: '약품 매칭',  icon: 'pill' },
    { label: '복약 정보 정리', icon: 'check-circle' },
  ];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (!recordId) {
      if (step >= steps.length) {
        const t = setTimeout(() => navigation.replace('OCRResult'), 400);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setStep(s => s + 1), 700);
      return () => clearTimeout(t);
    }

    let pollTimer: ReturnType<typeof setInterval>;
    let pollCount = 0;
    const MAX_POLLS = 30;

    ocrApi.createOcrJob({ record_id: recordId })
      .then(job => {
        setStep(1);
        pollTimer = setInterval(async () => {
          pollCount++;
          if (pollCount > MAX_POLLS) {
            clearInterval(pollTimer);
            setError('처리 시간이 초과됐어요. 다시 시도해주세요.');
            return;
          }
          try {
            const status = await jobsApi.getProcessingJob(job.job_id);
            if (status.status === 'completed') {
              clearInterval(pollTimer);
              setStep(steps.length);
              setTimeout(() => navigation.replace('OCRResult', { recordId }), 400);
            } else if (status.status === 'failed' || status.status === 'timeout') {
              clearInterval(pollTimer);
              setError('OCR 처리에 실패했어요. 다시 시도해주세요.');
            } else {
              setStep(s => Math.min(s + 1, steps.length - 1));
            }
          } catch { /* silent */ }
        }, 2000);
      })
      .catch(e => setError(extractApiError(e)));

    return () => clearInterval(pollTimer);
  }, [recordId]);

  const progress = Math.min(100, (step / steps.length) * 100);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <ScreenLayout noHeader contentStyle={{ justifyContent: 'flex-start' }}>
      <View style={{ paddingHorizontal: spacing.s20, paddingTop: spacing.safeTop, paddingBottom: spacing.s20 }}>
        <Text style={{ fontSize: typography.fz24, fontWeight: typography.fw7, color: colors.ink, marginBottom: 6 }}>
          처방전 분석 중
        </Text>
        <Text style={{ fontSize: typography.fz14, color: colors.muted }}>
          잠시만 기다려 주세요...
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.s20 }}>
        <Card style={{ width: '100%', maxWidth: 680, alignSelf: 'center', alignItems: 'center' }}>
          <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.s16 }}>
            <View style={s.spinnerWrap}>
              <Icon name="scan" size={36} color={colors.accent700} />
            </View>
            <Animated.View style={{
              position: 'absolute',
              width: 84, height: 84, borderRadius: 42,
              borderWidth: 3, borderColor: colors.accent, borderTopColor: 'transparent',
              transform: [{ rotate: spin }],
            }} />
          </View>

          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink, marginBottom: spacing.s4 }}>
            {recordId ? `기록 #${recordId}` : '처방전.jpg'}
          </Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s20 }}>OCR 처리 중</Text>

          <View style={[s.progressBg, { marginBottom: spacing.s24, alignSelf: 'stretch' }]}>
            <View style={[s.progressFill, { width: `${progress}%` as any }]} />
          </View>

          {error ? (
            <View style={{ alignItems: 'center', gap: spacing.s12 }}>
              <Text style={{ fontSize: typography.fz14, color: colors.danger, textAlign: 'center' }}>{error}</Text>
              <Button variant="primary" onPress={() => navigation.goBack()}>돌아가기</Button>
            </View>
          ) : (
            steps.map((st, i) => (
              <View key={st.label} style={[s.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
                <View style={[s.stepDot, {
                  backgroundColor: i < step ? colors.success : i === step ? colors.accent : colors.hairline,
                }]}>
                  {i < step
                    ? <Icon name="check" size={12} color="#fff" />
                    : <Icon name={st.icon} size={11} color={i === step ? '#fff' : colors.muted} />}
                </View>
                <Text style={{ fontSize: typography.fz14, flex: 1 }}>{st.label}</Text>
                {i < step && <Text style={{ fontSize: typography.fz13, color: colors.muted }}>완료</Text>}
                {i === step && <Text style={{ fontSize: typography.fz13, color: colors.accent }}>처리 중...</Text>}
              </View>
            ))
          )}
        </Card>
      </View>
    </ScreenLayout>
  );
}

export default OCRProcessingScreen;
