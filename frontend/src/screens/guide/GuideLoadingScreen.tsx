import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../../theme';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import ProgressBar from '../../components/ProgressBar';
import { guidesApi, jobsApi, extractApiError } from '../../api';
import type { AsyncJobStatus } from '../../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'GuideLoading'>;

// ─── 모듈 레벨 상수 ────────────────────────────────────────────────────────────

const BACKOFF_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 90_000;

const STATUS_TEXT: Partial<Record<AsyncJobStatus, string>> = {
  pending: '가이드 생성 준비 중...',
  running: '복약 정보 분석 중...',
};

const JOB_PROGRESS: Partial<Record<AsyncJobStatus, number>> = {
  pending: 20,
  running: 60,
};

// ─── GuideLoadingScreen ────────────────────────────────────────────────────────

export function GuideLoadingScreen({ navigation, route }: Props) {
  const { top: safeTop } = useSafeAreaInsets();
  const recordId: number | undefined = route?.params?.recordId;

  const [phase, setPhase] = useState<'loading' | 'failed' | 'timeout'>('loading');
  const [jobStatus, setJobStatus] = useState<AsyncJobStatus | null>(null);
  const [statusText, setStatusText] = useState('가이드 생성 준비 중...');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(false);

  const startGuide = () => {
    abortRef.current = false;
    setPhase('loading');
    setJobStatus(null);
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

        setJobStatus(job.status);
        setStatusText(STATUS_TEXT[job.status] ?? '분석 중...');
        const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)];
        attempt++;
        await new Promise<void>(res => setTimeout(res, delay));
      }
    } catch (err: any) {
      if (abortRef.current) return;
      setErrorMsg(extractApiError(err) || '가이드 생성 중 오류가 발생했어요.');
      setPhase('failed');
    }
  };

  useEffect(() => {
    startGuide();
    return () => {
      abortRef.current = true;
    };
  }, []);

  const centerStyle = { paddingTop: Math.max(safeTop + spacing.s16, spacing.safeTop) };

  if (phase === 'failed' || phase === 'timeout') {
    const msg =
      phase === 'timeout' ? '가이드 생성 시간이 초과됐어요. 다시 시도해주세요.' : errorMsg;
    return (
      <ScreenLayout noHeader contentStyle={[s.loadingCenter, centerStyle]}>
        <Card shadow style={{ width: '90%', alignItems: 'center' }}>
          <View style={[s.spinner, { backgroundColor: colors.danger50 }]}>
            <Icon name="alert-circle" size={36} color={colors.danger} />
          </View>
          <Text
            style={{
              fontSize: typography.fz17,
              fontWeight: typography.fw7,
              marginBottom: spacing.s8,
              textAlign: 'center',
            }}
          >
            {phase === 'timeout' ? '시간 초과' : '생성 실패'}
          </Text>
          <Text
            style={{
              fontSize: typography.fz13,
              color: colors.muted,
              marginBottom: spacing.s20,
              textAlign: 'center',
            }}
          >
            {msg}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.s12 }}>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                navigation.goBack();
                if (recordId) {
                  navigation
                    .getParent()
                    ?.getParent()
                    ?.navigate('Main', {
                      screen: 'RecordsTab',
                      params: { screen: 'RecordDetail', params: { recordId } },
                    });
                } else {
                  navigation
                    .getParent()
                    ?.getParent()
                    ?.navigate('Main', { screen: 'HomeTab', params: { screen: 'Home' } });
                }
              }}
            >
              뒤로가기
            </Button>
            <Button variant="primary" size="sm" onPress={startGuide}>
              다시 시도
            </Button>
          </View>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout noHeader contentStyle={[s.loadingCenter, centerStyle]}>
      <Card shadow style={{ width: '90%', alignItems: 'center' }}>
        <View style={s.spinner}>
          <ActivityIndicator color={colors.accent700} size="large" />
        </View>
        <Text
          style={{
            fontSize: typography.fz17,
            fontWeight: typography.fw7,
            marginBottom: spacing.s4,
          }}
        >
          맞춤 가이드를 만들고 있어요
        </Text>
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginBottom: spacing.s20 }}>
          {statusText}
        </Text>
        <ProgressBar
          progress={jobStatus ? (JOB_PROGRESS[jobStatus] ?? 40) : 20}
          style={{ alignSelf: 'stretch', marginBottom: spacing.s20 }}
        />
        <Text style={{ fontSize: typography.fz12, color: colors.muted2 }}>
          최대 90초가 소요될 수 있어요
        </Text>
      </Card>
    </ScreenLayout>
  );
}

export default GuideLoadingScreen;

// ─── StyleSheet ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  spinner: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    backgroundColor: colors.accent50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s16,
  },
});
