import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, TextInput, Animated, ActivityIndicator,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { colors, radii, spacing, typography } from '../../theme';
import { ocrApi, jobsApi, recordsApi, drugsApi, extractApiError } from '../../api';
import type { MedicationCandidate, DrugSearchResult } from '../../api';

// ─── OCRProcessingScreen ──────────────────────────────────────────────────────

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

  // Real API flow
  useEffect(() => {
    if (!recordId) {
      // Demo fallback — animate through fake steps
      if (step >= steps.length) {
        const t = setTimeout(() => navigation.replace('OCRResult'), 400);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setStep(s => s + 1), 700);
      return () => clearTimeout(t);
    }

    let pollTimer: ReturnType<typeof setInterval>;
    let pollCount = 0;
    const MAX_POLLS = 30; // 60s at 2s interval

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
      <View style={{ paddingHorizontal: spacing.s5, paddingTop: spacing.safeTop, paddingBottom: spacing.s5 }}>
        <Text style={{ fontSize: typography.fz24, fontWeight: typography.fw7, color: colors.ink, marginBottom: 6 }}>
          처방전 분석 중
        </Text>
        <Text style={{ fontSize: typography.fz14, color: colors.muted }}>
          잠시만 기다려 주세요...
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.s5 }}>
        <Card style={{ width: '100%', maxWidth: 680, alignSelf: 'center', alignItems: 'center' }}>
          <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.s4 }}>
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

          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink, marginBottom: spacing.s1 }}>
            {recordId ? `기록 #${recordId}` : '처방전.jpg'}
          </Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s5 }}>OCR 처리 중</Text>

          <View style={[s.progressBg, { marginBottom: spacing.s6, alignSelf: 'stretch' }]}>
            <View style={[s.progressFill, { width: `${progress}%` as any }]} />
          </View>

          {error ? (
            <View style={{ alignItems: 'center', gap: spacing.s3 }}>
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

// ─── OCRResultScreen ──────────────────────────────────────────────────────────

export function OCRResultScreen({ navigation, route }: any) {
  const recordId: number | undefined = route?.params?.recordId;
  const { ocrSession, setOcrSession, flash } = useApp();
  const [candidates, setCandidates] = useState<MedicationCandidate[]>([]);
  const [loading, setLoading] = useState(!!recordId);
  const [error, setError] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);

  useEffect(() => {
    if (!recordId) return;
    (async () => {
      try {
        const res = await recordsApi.getOcrResult(recordId);
        setCandidates(res.medication_candidates ?? []);
        // Sync into AppContext so DrugDosage screen can reference
        setOcrSession({
          ...ocrSession,
          drugs: (res.medication_candidates ?? []).map(c => ({
            name: c.drug_name,
            maker: '',
            time: '',
            confidence: Math.round(c.confidence * 100),
            status: (!c.is_verified && c.confidence < 0.7) ? 'needsCheck' : 'ok',
          })),
        });
      } catch (e) {
        setError(extractApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  const displayDrugs = recordId
    ? candidates.map(c => ({
        name: c.drug_name,
        maker: '',
        time: '',
        confidence: Math.round(c.confidence * 100),
        status: (!c.is_verified && c.confidence < 0.7) ? 'needsCheck' : 'ok' as 'ok' | 'needsCheck',
      }))
    : ocrSession.drugs;

  if (loading) {
    return (
      <View style={[s.loadingRoot, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s3 }}>OCR 결과 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScreenLayout
      title="OCR 인식 결과 확인"
      back
      onBack={() => navigation.goBack()}
      right={
        <Button variant="primary" size="sm" leftIcon="wand" onPress={() => navigation.navigate('GuideLoading', recordId ? { recordId } : undefined)}>가이드 생성하기</Button>
      }
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s5 }}
    >
      {!imageRemoved ? (
        <Card style={{ marginBottom: 14 }}>
          <View style={s.docPreview}>
            <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
            <TouchableOpacity onPress={() => { setImageRemoved(true); flash('이미지를 제거했습니다'); }} style={s.removeBtn}>
              <Icon name="x" size={14} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.s3 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>
              {recordId ? `기록 #${recordId}` : ocrSession.fileName}
            </Text>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{ocrSession.fileSize}</Text>
          </View>
        </Card>
      ) : (
        <Card style={{ marginBottom: 14, alignItems: 'center', paddingVertical: spacing.s6 }}>
          <Icon name="image" size={24} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: spacing.s2 }}>원본 이미지를 제거했어요</Text>
          <TouchableOpacity onPress={() => setImageRemoved(false)} style={{ marginTop: 4 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.accent }}>되돌리기</Text>
          </TouchableOpacity>
        </Card>
      )}

      {error ? (
        <View style={[s.banner, { backgroundColor: colors.danger50, marginBottom: 14 }]}>
          <Icon name="alert" size={16} color={colors.danger} />
          <Text style={{ fontSize: typography.fz14, color: colors.danger, marginLeft: spacing.s2 }}>{error}</Text>
        </View>
      ) : (
        <View style={[s.banner, s.bannerSuccess, { marginBottom: 14 }]}>
          <Icon name="check-circle" size={16} color={colors.success} />
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, marginLeft: spacing.s2 }}>OCR 인식이 완료됐어요</Text>
        </View>
      )}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="link" size={14} color={colors.ink2} />
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>인식된 약품 ({displayDrugs.length}종)</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DrugSearch')}>
            <Text style={{ fontSize: typography.fz13, color: colors.accent }}>+ 직접 추가</Text>
          </TouchableOpacity>
        </View>

        {displayDrugs.map((d, i) => {
          const warn = d.status === 'needsCheck';
          return (
            <TouchableOpacity key={i}
              style={[s.drugCard, { backgroundColor: warn ? colors.warning50 : colors.success50 }]}
              onPress={() => navigation.navigate('DrugDosage')}
            >
              <View style={[s.drugDot, { backgroundColor: warn ? colors.warning : colors.success }]}>
                {warn ? <Icon name="alert" size={14} color="#fff" /> : <Icon name="check" size={14} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{d.name}</Text>
                  {d.maker ? <Text style={{ fontSize: typography.fz12, color: colors.muted }}>({d.maker})</Text> : null}
                </View>
                <Text style={{ fontSize: typography.fz12, color: warn ? '#92400E' : '#065F46', marginTop: 2 }}>
                  {warn ? `인식률 ${d.confidence}% — 확인이 필요해요` : d.time || `인식률 ${d.confidence}%`}
                </Text>
              </View>
              <View style={[s.chip, { backgroundColor: warn ? colors.warning : colors.white }]}>
                <Text style={{ fontSize: typography.fz11, color: warn ? colors.white : '#065F46', fontWeight: typography.fw6 }}>
                  {warn ? '검색/확인' : '수정'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    </ScreenLayout>
  );
}

// ─── DrugSearchScreen ─────────────────────────────────────────────────────────

export function DrugSearchScreen({ navigation, route }: any) {
  const [query, setQuery] = useState(route?.params?.medicationName ?? '');
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await drugsApi.searchDrugs({ q: query.trim(), size: 10 });
      setResults(res.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="식약처 약품 검색"
      back
      onBack={() => navigation.goBack()}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s5 }}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s2, marginBottom: 14 }}>
        <Icon name="search" size={16} color={colors.muted} />
        <TextInput
          style={{ flex: 1, fontSize: typography.fz14, color: colors.ink, height: 40 }}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
          autoFocus
        />
        <Button variant="primary" onPress={doSearch} loading={loading}>검색</Button>
      </Card>

      {searched && !loading && (
        <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: 10 }}>
          검색 결과 {results.length}건
        </Text>
      )}

      {results.map((c, i) => (
        <Card key={i} style={{ marginBottom: spacing.s3 }}>
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink, marginBottom: spacing.s1 }}>{c.drug_name}</Text>
          {c.ingredient_name ? (
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: spacing.s1 }}>성분: {c.ingredient_name}</Text>
          ) : null}
          {c.manufacturer ? (
            <Text style={{ fontSize: typography.fz12, color: colors.accent, marginBottom: spacing.s3 }}>{c.manufacturer}</Text>
          ) : null}
          <Button variant="primary" size="md" style={{ borderRadius: radii.md }} onPress={() => navigation.navigate('DrugDosage')}>이 약품 선택</Button>
        </Card>
      ))}

      {searched && !loading && results.length === 0 && (
        <View style={{ alignItems: 'center', paddingTop: spacing.s8 }}>
          <Icon name="search" size={32} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s3 }}>검색 결과가 없어요.</Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted2, marginTop: spacing.s1 }}>다른 이름으로 검색해보세요.</Text>
        </View>
      )}
    </ScreenLayout>
  );
}

// ─── DrugDosageScreen ─────────────────────────────────────────────────────────

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
    navigation.navigate('OCRResult');
  };

  const Section = ({ label, options, value, onChange }: any) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s2 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s2 }}>
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
      onBack={() => navigation.navigate('DrugSearch')}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s5 }}
    >
      <Text style={{ fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s5 }}>
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
          <Text style={{ fontSize: typography.fz13, color: colors.ink2, flex: 1, marginLeft: spacing.s2 }}>
            아래 값은 OCR 자동 인식 결과입니다. 처방전과 다른 경우 직접 수정해 주세요.
          </Text>
        </View>

        <Section label="1일 복용 횟수" options={['1회', '2회', '3회', '4회']} value={freq} onChange={setFreq} />
        <Section label="복용 시간" options={['식전 30분', '식후 30분', '식전 즉시', '식후 즉시', '취침 전', '공복']} value={time} onChange={setTime} />
        <Section label="복용 기간" options={['7일', '14일', '30일', '60일', '90일', '장기복용']} value={duration} onChange={setDuration} />

        <Card style={{ backgroundColor: colors.surface2, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s4 }}>
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

const s = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: colors.canvas },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.s3, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
  bannerWarn:    { backgroundColor: colors.warning50 },
  docPreview: { height: 140, backgroundColor: colors.accent50, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: radii.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  drugCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, padding: 14, borderRadius: radii.md, marginBottom: spacing.s2 },
  drugDot: { width: 28, height: 28, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  spinnerWrap: { width: 84, height: 84, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.s4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s3, paddingVertical: spacing.s2, alignSelf: 'stretch' },
  stepDot: { width: 24, height: 24, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
});

export default OCRProcessingScreen;
