import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import { guidesApi, jobsApi, extractApiError } from '../../api';
import type { AsyncJobStatus } from '../../api';
import { s } from './_guideShared';

const BACKOFF_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 90_000;

const STATUS_TEXT: Partial<Record<AsyncJobStatus, string>> = {
  pending: '가이드 생성 준비 중...',
  running: '복약 정보 분석 중...',
};

export function GuideLoadingScreen({ navigation, route }: any) {
  const { top: safeTop } = useSafeAreaInsets();
  const recordId: number | undefined = route?.params?.recordId;
  const [phase, setPhase] = useState<'loading' | 'failed' | 'timeout'>('loading');
  const [statusText, setStatusText] = useState('가이드 생성 준비 중...');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(false);

  const startGuide = () => {
    abortRef.current = false;
    setPhase('loading');
    setErrorMsg('');
    setStatusText('가이드 생성 준비 중...');
    run();
  };

  const run = async () => {
    const deadline = Date.now() + TIMEOUT_MS;

    try {
      const created = await guidesApi.createGuide({ record_id: recordId });
      if (abortRef.current) return;

      const guideId = created.guide_id;
      const jobId = created.job_id;

      let attempt = 0;
      while (true) {
        if (abortRef.current) return;
        if (Date.now() > deadline) {
          setPhase('timeout');
          return;
        }

        const job = await jobsApi.getProcessingJob(jobId);
        if (abortRef.current) return;

        if (job.status === 'completed') {
          navigation.replace('GuideResult', { guideId });
          return;
        }
        if (job.status === 'failed') {
          setErrorMsg('가이드 생성에 실패했어요. 다시 시도해주세요.');
          setPhase('failed');
          return;
        }
        if (job.status === 'timeout') {
          setPhase('timeout');
          return;
        }

        setStatusText(STATUS_TEXT[job.status] ?? '분석 중...');
        const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)];
        attempt++;
        await new Promise<void>(res => setTimeout(res, delay));
      }
    } catch (err: any) {
      if (abortRef.current) return;
      console.error('[GuideLoading] error:', err);
      setErrorMsg(extractApiError(err) || '가이드 생성 중 오류가 발생했어요.');
      setPhase('failed');
    }
  };

  useEffect(() => {
    startGuide();
    return () => { abortRef.current = true; };
  }, []);

  if (phase === 'failed' || phase === 'timeout') {
    const msg = phase === 'timeout' ? '가이드 생성 시간이 초과됐어요. 다시 시도해주세요.' : errorMsg;
    return (
      <ScreenLayout noHeader contentStyle={{ justifyContent: 'center', alignItems: 'center', paddingTop: Math.max(safeTop + spacing.s16, spacing.safeTop) }}>
        <Card shadow style={{ width: '90%', alignItems: 'center' }}>
          <View style={[s.spinner, { backgroundColor: colors.danger50 }]}>
            <Icon name="alert-circle" size={36} color={colors.danger} />
          </View>
          <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7, marginBottom: spacing.s8, textAlign: 'center' }}>
            {phase === 'timeout' ? '시간 초과' : '생성 실패'}
          </Text>
          <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20, textAlign: 'center' }}>
            {msg}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.s12 }}>
            <Button variant="ghost" size="sm" onPress={() => navigation.goBack()}>뒤로가기</Button>
            <Button variant="primary" size="sm" onPress={startGuide}>다시 시도</Button>
          </View>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout noHeader contentStyle={{ justifyContent: 'center', alignItems: 'center', paddingTop: Math.max(safeTop + spacing.s16, spacing.safeTop) }}>
      <Card shadow style={{ width: '90%', alignItems: 'center' }}>
        <View style={s.spinner}>
          <ActivityIndicator color={colors.accent700} size="large" />
        </View>
        <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7, marginBottom: spacing.s4 }}>
          맞춤 가이드를 만들고 있어요
        </Text>
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20 }}>
          {statusText}
        </Text>

        <View style={[s.progressBg, { alignSelf: 'stretch', marginBottom: spacing.s20 }]}>
          <View style={[s.progressFill, { width: statusText.includes('분석') ? '60%' : '20%' }]} />
        </View>

        <Text style={{ fontSize: typography.fz12, color: colors.muted2 }}>최대 90초가 소요될 수 있어요</Text>
      </Card>
    </ScreenLayout>
  );
}

export default GuideLoadingScreen;
