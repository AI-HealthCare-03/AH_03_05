import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../../theme';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ScreenLayout from '../../components/ScreenLayout';
import ProgressBar from '../../components/ProgressBar';
import { guidesApi, extractApiError } from '../../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParams } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'GuideLoading'>;

// ─── GuideLoadingScreen ────────────────────────────────────────────────────────

export function GuideLoadingScreen({ navigation, route }: Props) {
  const { top: safeTop } = useSafeAreaInsets();
  const recordId: number | undefined = route?.params?.recordId;

  const [phase, setPhase] = useState<'loading' | 'failed' | 'timeout'>('loading');
  const [progress, setProgress] = useState(8);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(false);

  const startGuide = () => {
    abortRef.current = false;
    setPhase('loading');
    setProgress(8);
    setErrorMsg('');
    run();
  };

  // 가이드 생성은 동기 API(POST /guides/generate)가 완료까지 블록하고 결과를 반환한다.
  // 별도 비동기 job/폴링이 없으며 응답에 job_id도 없으므로, 성공하면 바로 결과 화면으로 이동한다.
  const run = async () => {
    try {
      const created = await guidesApi.createGuide({ record_id: recordId });
      if (abortRef.current) return;
      // BE는 status를 대문자(COMPLETED/FAILED)로 내려줄 수 있어 소문자로 비교한다.
      if (created.status?.toLowerCase() === 'failed') {
        setErrorMsg('가이드 생성에 실패했어요. 다시 시도해주세요.');
        setPhase('failed');
        return;
      }
      setProgress(100);
      navigation.replace('GuideResult', { guideId: created.guide_id });
    } catch (err: any) {
      if (abortRef.current) return;
      if (err?.code === 'ECONNABORTED') {
        setPhase('timeout');
        return;
      }
      setErrorMsg(extractApiError(err) || '가이드 생성 중 오류가 발생했어요.');
      setPhase('failed');
    }
  };

  // 동기 생성이 진행되는 동안 진행 막대를 천천히 채워 멈춘 느낌을 방지(완료 시 100).
  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setProgress(p => Math.min(p + 4, 90)), 1200);
    return () => clearInterval(t);
  }, [phase]);

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
          복약 정보를 분석하고 있어요...
        </Text>
        <ProgressBar
          progress={progress}
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
