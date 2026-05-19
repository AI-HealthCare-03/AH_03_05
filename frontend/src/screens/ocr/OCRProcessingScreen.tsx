import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Animated,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, radii, spacing } from '../../theme';

// ─── OCRProcessingScreen ──────────────────────────────────────────────────────

export function OCRProcessingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    { label: '이미지 보정', icon: 'image' },
    { label: '텍스트 인식', icon: 'scan' },
    { label: '약품 매칭',  icon: 'pill' },
    { label: '복약 정보 정리', icon: 'check-circle' },
  ];

  // 원형 스피너 회전 애니메이션
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(() => navigation.replace('OCRResult'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), 700);
    return () => clearTimeout(t);
  }, [step]);

  const progress = Math.min(100, (step / steps.length) * 100);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* 페이지 헤더 */}
      <View style={{ paddingHorizontal: spacing.s5, paddingTop: 52, paddingBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 6 }}>
          처방전 분석 중
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>
          잠시만 기다려 주세요. 잠시 후 분석 결과를 보여드릴게요.
        </Text>
      </View>

      <View style={[s.root, { justifyContent: 'flex-start', paddingHorizontal: spacing.s5 }]}>
        <View style={[s.card, { width: '100%', maxWidth: 680, alignSelf: 'center', alignItems: 'center' }]}>
          {/* 원형 스피너 */}
          <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <View style={s.spinnerWrap}>
              <Icon name="scan" size={36} color={colors.accent700} />
            </View>
            <Animated.View style={{
              position: 'absolute',
              width: 84, height: 84, borderRadius: 42,
              borderWidth: 3,
              borderColor: colors.accent,
              borderTopColor: 'transparent',
              transform: [{ rotate: spin }],
            }} />
          </View>

          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 }}>처방전.jpg</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>1.8MB · OCR 처리 중</Text>

          {/* 진행률 바 */}
          <View style={[s.progressBg, { marginBottom: 24, alignSelf: 'stretch' }]}>
            <View style={[s.progressFill, { width: `${progress}%` as any }]} />
          </View>

          {/* 단계 목록 — 인라인 상태 */}
          {steps.map((st, i) => (
            <View key={st.label} style={[s.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
              <View style={[s.stepDot, {
                backgroundColor: i < step ? colors.success : i === step ? colors.accent : colors.hairline,
              }]}>
                {i < step
                  ? <Icon name="check" size={12} color="#fff" />
                  : <Icon name={st.icon} size={11} color={i === step ? '#fff' : colors.muted} />}
              </View>
              <Text style={{ fontSize: 14, flex: 1 }}>{st.label}</Text>
              {i < step && (
                <Text style={{ fontSize: 13, color: colors.muted }}>완료</Text>
              )}
              {i === step && (
                <Text style={{ fontSize: 13, color: colors.accent }}>처리 중...</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── OCRResultScreen ──────────────────────────────────────────────────────────

export function OCRResultScreen({ navigation }: any) {
  const { ocrSession, setOcrSession, flash } = useApp();
  const [imageRemoved, setImageRemoved] = useState(false);

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', flex: 1, marginLeft: 8 }}>OCR 인식 결과 확인</Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('GuideLoading')}>
          <Icon name="wand" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>가이드 생성하기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.s5 }}>
        {/* Image preview */}
        {!imageRemoved ? (
          <View style={[s.card, { marginBottom: 14 }]}>
            <View style={s.docPreview}>
              <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
              <TouchableOpacity onPress={() => { setImageRemoved(true); flash('이미지를 제거했습니다'); }} style={s.removeBtn}>
                <Icon name="x" size={14} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600' }}>{ocrSession.fileName}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{ocrSession.fileSize}</Text>
            </View>
          </View>
        ) : (
          <View style={[s.card, { marginBottom: 14, alignItems: 'center', paddingVertical: 24 }]}>
            <Icon name="image" size={24} color={colors.muted2} />
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>원본 이미지를 제거했어요</Text>
            <TouchableOpacity onPress={() => setImageRemoved(false)} style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: colors.accent }}>되돌리기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success banner */}
        <View style={[s.banner, s.bannerSuccess, { marginBottom: 14 }]}>
          <Icon name="check-circle" size={16} color={colors.success} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, marginLeft: 8 }}>OCR 인식이 완료됐어요</Text>
        </View>

        {/* Drug list */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: 13, fontWeight: '600' }}>인식된 약품 ({ocrSession.drugs.length}종)</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('DrugSearch')}>
              <Text style={{ fontSize: 13, color: colors.accent }}>+ 직접 추가</Text>
            </TouchableOpacity>
          </View>

          {ocrSession.drugs.map((d, i) => {
            const warn = d.status === 'needsCheck';
            return (
              <TouchableOpacity key={i} style={[s.drugCard, { backgroundColor: warn ? colors.warning50 : colors.success50 }]}
                onPress={() => navigation.navigate('DrugDosage')}>
                <View style={[s.drugDot, { backgroundColor: warn ? colors.warning : colors.success }]}>
                  {warn ? <Icon name="alert" size={14} color="#fff" /> : <Icon name="check" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600' }}>{d.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>({d.maker})</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: warn ? '#92400E' : '#065F46', marginTop: 2 }}>
                    {warn ? `인식률 ${d.confidence}% — 확인이 필요해요` : d.time}
                  </Text>
                </View>
                <View style={[s.chip, { backgroundColor: warn ? colors.warning : colors.white }]}>
                  <Text style={{ fontSize: 11, color: warn ? '#fff' : '#065F46', fontWeight: '600' }}>
                    {warn ? '검색/확인' : '수정'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── DrugSearchScreen ─────────────────────────────────────────────────────────

export function DrugSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('암로디핀');
  const candidates = [
    { name: '노바스크정 5mg', maker: '한국화이자제약', ingredient: 'Amlodipine besylate 5mg' },
    { name: '암로디핀정 5mg', maker: '한미약품', ingredient: 'Amlodipine besylate 5mg' },
    { name: '암로핀정 5mg', maker: '유한양행', ingredient: 'Amlodipine besylate 5mg' },
  ];

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', flex: 1, marginLeft: 8 }}>식약처 약품 검색</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.s5 }}>
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }]}>
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: colors.ink, height: 40 }}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          <TouchableOpacity style={s.btnPrimary}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>검색</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>검색 결과 {candidates.length}건</Text>

        {candidates.map((c, i) => (
          <View key={i} style={[s.card, { marginBottom: 12 }]}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 4 }}>{c.name}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>성분: {c.ingredient}</Text>
            <Text style={{ fontSize: 12, color: colors.accent, marginBottom: 12 }}>{c.maker}</Text>
            <TouchableOpacity style={[s.btnPrimary, { borderRadius: radii.md }]} onPress={() => navigation.navigate('DrugDosage')}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>이 약품 선택</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
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
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o: string) => (
          <TouchableOpacity key={o} style={[s.chip, value === o && s.chipActive]} onPress={() => onChange(o)}>
            <Text style={[{ fontSize: 13 }, value === o && { color: colors.accent700, fontWeight: '600' }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('DrugSearch')} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', flex: 1, marginLeft: 8 }}>복용법 입력</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.s5 }}>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: spacing.s5 }}>OCR 인식값이 자동으로 채워졌어요. 내용을 확인하고 필요시 수정해 주세요.</Text>

        <View style={s.card}>
          {/* Selected drug */}
          <View style={[s.banner, s.bannerSuccess, { marginBottom: 14 }]}>
            <View style={[s.chip, { backgroundColor: colors.success }]}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>선택됨</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>메트포르민정 500mg</Text>
              <Text style={{ fontSize: 12, color: '#065F46' }}>성분: Metformin | 제조사: A제약</Text>
            </View>
          </View>

          <View style={[s.banner, s.bannerWarn, { marginBottom: 20 }]}>
            <Icon name="alert" size={16} color={colors.warning} />
            <Text style={{ fontSize: 13, color: colors.ink2, flex: 1, marginLeft: 8 }}>아래 값은 OCR 자동 인식 결과입니다. 처방전과 다른 경우 직접 수정해 주세요.</Text>
          </View>

          <Section label="1일 복용 횟수" options={['1회', '2회', '3회', '4회']} value={freq} onChange={setFreq} />
          <Section label="복용 시간" options={['식전 30분', '식후 30분', '식전 즉시', '식후 즉시', '취침 전', '공복']} value={time} onChange={setTime} />
          <Section label="복용 기간" options={['7일', '14일', '30일', '60일', '90일', '장기복용']} value={duration} onChange={setDuration} />

          {/* Summary */}
          <View style={[s.card, { backgroundColor: colors.surface2, marginBottom: 18 }]}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>입력 확인</Text>
              {[['횟수', freq], ['시간', time], ['기간', duration]].map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', gap: 4, alignItems: 'baseline' }}>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{k}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[s.btnPrimary, { borderRadius: radii.md, height: 50 }]} onPress={save} activeOpacity={0.85}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>복용법 저장하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.s4, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.hairline },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s5, borderWidth: 0.5, borderColor: colors.hairline },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
  bannerWarn:    { backgroundColor: colors.warning50 },
  docPreview: { height: 140, backgroundColor: colors.accent50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  drugCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 8 },
  drugDot: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  btnPrimary: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  spinnerWrap: { width: 84, height: 84, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, alignSelf: 'stretch' },
  stepDot: { width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
});

export default OCRProcessingScreen;
