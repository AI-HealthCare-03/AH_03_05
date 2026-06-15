import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, LayoutChangeEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { ocrApi, jobsApi, extractApiError } from '../../api';
import { s } from './_ocrShared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParams, RootStackParams } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<HomeStackParams, 'OCRProcessing'>;

const STEPS = [
  { label: '이미지 보정', icon: 'image' },
  { label: '텍스트 인식', icon: 'scan' },
  { label: '약품 매칭', icon: 'pill' },
  { label: '복약 정보 정리', icon: 'check-circle' },
];

// BE가 OCR 완료 시 result_ref에 결과 record_id(문자열)를 채운다. 유효한 양의 정수면 그 값을
// 결과 화면 라우팅의 정본으로, 아니면(없음/비정상) 요청 시점 recordId로 폴백한다.
export function resolveResultRecordId(
  resultRef: string | null | undefined,
  fallbackId: number | undefined
): number | undefined {
  const parsed = Number(resultRef);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackId;
}

type StepItemProps = {
  st: { label: string; icon: string };
  index: number;
  step: number;
};

function StepItem({ st, index: i, step }: StepItemProps) {
  return (
    <View style={[s.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
      <View
        style={[
          s.stepDot,
          {
            backgroundColor:
              i < step ? colors.success : i === step ? colors.accent : colors.hairline,
          },
        ]}
      >
        {i < step ? (
          <Icon name="check" size={12} color={colors.white} />
        ) : (
          <Icon name={st.icon} size={11} color={i === step ? colors.white : colors.muted} />
        )}
      </View>
      <Text style={{ fontSize: typography.fz14, flex: 1 }}>{st.label}</Text>
      {i < step && <Text style={{ fontSize: typography.fz13, color: colors.muted }}>완료</Text>}
      {i === step && (
        <Text style={{ fontSize: typography.fz13, color: colors.accent }}>처리 중...</Text>
      )}
    </View>
  );
}

export function OCRProcessingScreen({ navigation, route }: Props) {
  const { top: safeTop } = useSafeAreaInsets();
  const recordId: number | undefined = route?.params?.recordId;
  const [step, setStep] = useState(0);
  // BE가 progress 실제값을 내려주면 사용, 아니면 null → step 기반 애니메이션으로 폴백
  const [realProgress, setRealProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const spinAnim = useRef(new Animated.Value(0)).current;
  // RN Web에서 % / alignSelf:stretch 가 Card padding을 무시하고 border-box 기준으로 계산되는
  // 버그를 우회하기 위해 onLayout으로 실측 너비를 캡처해 픽셀 값으로 직접 지정한다.
  const [trackWidth, setTrackWidth] = useState(0);
  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [spinAnim]);

  useEffect(() => {
    if (!recordId) return;

    let pollTimer: ReturnType<typeof setInterval>;
    let pollCount = 0;
    const MAX_POLLS = 30;

    // 3초마다 step 1씩 증가, 최대 STEPS.length - 1(75%)에서 대기
    const progressTimer = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }, 3000);

    ocrApi
      .createOcrJob({ record_id: recordId })
      .then(job => {
        pollTimer = setInterval(async () => {
          pollCount++;
          if (pollCount > MAX_POLLS) {
            clearInterval(pollTimer);
            clearInterval(progressTimer);
            setError('처리 시간이 초과됐어요. 다시 시도해주세요.');
            return;
          }
          try {
            const status = await jobsApi.getProcessingJob(job.job_id);
            if (typeof status.progress === 'number') setRealProgress(status.progress);
            if (status.status === 'completed') {
              clearInterval(pollTimer);
              clearInterval(progressTimer);
              setStep(STEPS.length);
              const targetId = resolveResultRecordId(status.result_ref, recordId);
              setTimeout(() => navigation.replace('OCRResult', { recordId: targetId }), 400);
            } else if (status.status === 'failed' || status.status === 'timeout') {
              clearInterval(pollTimer);
              clearInterval(progressTimer);
              setError('OCR 처리에 실패했어요. 다시 시도해주세요.');
            }
          } catch {
            /* silent */
          }
        }, 2000);
      })
      .catch(e => {
        clearInterval(progressTimer);
        setError(extractApiError(e));
      });

    return () => {
      clearInterval(pollTimer);
      clearInterval(progressTimer);
    };
    // recordId당 1회만 실행 — navigation 추가 시 OCR job 중복 생성 위험
  }, [recordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stepProgress = Math.min(100, (step / STEPS.length) * 100);
  // 실제값이 step 기반보다 클 때만 채택 — 역행(되감김) 방지
  const progress = realProgress != null ? Math.max(stepProgress, realProgress) : stepProgress;
  const fillWidth = trackWidth > 0 ? (trackWidth * progress) / 100 : 0;
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <ScreenLayout noHeader contentStyle={{ justifyContent: 'flex-start' }}>
      <View
        style={{
          paddingHorizontal: spacing.s20,
          paddingTop: Math.max(safeTop + spacing.s16, spacing.safeTop),
          paddingBottom: spacing.s24,
        }}
      >
        <Text
          style={{
            fontSize: typography.fz24,
            fontWeight: typography.fw7,
            color: colors.ink,
            marginBottom: spacing.s8,
          }}
        >
          처방전 분석 중
        </Text>
        <Text style={{ fontSize: typography.fz14, color: colors.ink2 }}>
          잠시만 기다려 주세요...
        </Text>
        {Platform.OS === 'web' && (
          <Text
            style={{ fontSize: typography.fz12, color: colors.warning, marginTop: spacing.s12 }}
          >
            ⚠ 분석 중 브라우저 창 크기를 조정하면 화면이 새로 고침될 수 있어요.
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.s20 }}>
        {/* overflow:hidden — RN Web border-box 오버플로 방어 */}
        <Card
          shadow
          style={{ width: '100%', maxWidth: 680, alignSelf: 'center', overflow: 'hidden' }}
        >
          {/* 스피너 + 제목 */}
          <View style={{ alignItems: 'center', marginBottom: spacing.s20 }}>
            {/* 84×84 컨테이너: 두 레이어 모두 absolute top:0 left:0 으로 기준점 통일 */}
            <View style={{ width: 84, height: 84, marginBottom: spacing.s16 }}>
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 84,
                  height: 84,
                  borderRadius: radii.pill,
                  backgroundColor: colors.accent50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="scan" size={36} color={colors.accent700} />
              </View>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 84,
                  height: 84,
                  borderRadius: radii.pill,
                  borderWidth: 3,
                  borderColor: colors.accent,
                  borderTopColor: 'transparent',
                  transform: [{ rotate: spin }],
                }}
              />
            </View>
            <Text
              style={{
                fontSize: typography.fz15,
                fontWeight: typography.fw7,
                color: colors.ink,
                marginBottom: spacing.s4,
              }}
            >
              {recordId ? `기록 #${recordId}` : '처방전.jpg'}
            </Text>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>OCR 처리 중</Text>
            {!error && (
              <Text
                style={{
                  fontSize: typography.fz12,
                  color: colors.muted,
                  marginTop: spacing.s4,
                  textAlign: 'center',
                }}
              >
                분석에 최대 60초가 소요될 수 있습니다.
              </Text>
            )}
          </View>

          {/* 진행 바 — onLayout으로 실측 너비 캡처 후 픽셀 값 사용 */}
          <View
            onLayout={onTrackLayout}
            style={{
              height: 6,
              borderRadius: radii.xs,
              backgroundColor: colors.hairline,
              overflow: 'hidden',
              marginBottom: spacing.s24,
            }}
          >
            {fillWidth > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: fillWidth,
                  backgroundColor: colors.accent,
                  borderRadius: radii.xs,
                }}
              />
            )}
          </View>

          {error ? (
            <View style={{ alignItems: 'center', gap: spacing.s12 }}>
              <Text
                style={{ fontSize: typography.fz14, color: colors.danger, textAlign: 'center' }}
              >
                {error}
              </Text>
              <Button
                variant="primary"
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else
                    (navigation as unknown as NativeStackNavigationProp<RootStackParams>).navigate(
                      'Main'
                    );
                }}
              >
                돌아가기
              </Button>
            </View>
          ) : (
            STEPS.map((st, i) => <StepItem key={st.label} st={st} index={i} step={step} />)
          )}
        </Card>
      </View>
    </ScreenLayout>
  );
}

export default OCRProcessingScreen;
