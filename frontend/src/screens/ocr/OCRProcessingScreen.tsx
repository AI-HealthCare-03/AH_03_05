import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Animated,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import BellButton from '../../components/BellButton';
import { colors, radii, spacing, typography } from '../../theme';

// ─── OCRProcessingScreen ──────────────────────────────────────────────────────

export function OCRProcessingScreen({ navigation }: any) {
  const { ocrSession } = useApp();
  const [step, setStep] = useState(0);
  const steps = [
    { label: '이미지 보정', icon: 'image' },
    { label: '텍스트 인식', icon: 'scan' },
    { label: '약품 매칭', icon: 'pill' },
    { label: '복약 정보 정리', icon: 'check-circle' },
  ];

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(() => navigation.replace('OCRResult'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), 700);
    return () => clearTimeout(t);
  }, [step]);

  const progress = Math.min(100, (step / steps.length) * 100);
  const fileName = ocrSession?.fileName || '파일 처리 중';
  const fileSize = ocrSession?.fileSize || '';

  return (
    <View style={s.root}>
      <View style={s.loadingCenter}>
        <View style={[s.card, s.loadingCard]}>
          {/* Spinner icon */}
          <View style={s.spinnerWrap}>
            <Icon name="scan" size={36} color={colors.accent700} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4, textAlign: 'center' }}>{fileName}</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20, textAlign: 'center' }}>{fileSize ? `${fileSize} · ` : ''}OCR 처리 중</Text>

          {/* Progress bar */}
          <View style={[s.progressBg, { marginBottom: 20, alignSelf: 'stretch' }]}>
            <View style={[s.progressFill, { width: `${progress}%` as any }]} />
          </View>

          {steps.map((st, i) => (
            <View key={st.label} style={[s.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
              <View style={[s.stepDot, {
                backgroundColor: i < step ? colors.success : i === step ? colors.accent : colors.hairline,
              }]}>
                {i < step
                  ? <Icon name="check" size={12} color="#fff" />
                  : <Icon name={st.icon} size={11} color={i === step ? '#fff' : colors.muted} />}
              </View>
              <Text style={{ fontSize: 13, flex: 1, color: colors.ink }}>{st.label}</Text>
              {i === step && <Text style={{ fontSize: 12, color: colors.accent }}>처리 중...</Text>}
              {i < step  && <Text style={{ fontSize: 12, color: colors.success }}>완료</Text>}
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

  const deleteDrug = (index: number) => {
    setOcrSession({
      ...ocrSession,
      drugs: ocrSession.drugs.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <View style={s.root}>
      <BellButton />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 페이지 헤더 */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backLink}>
              <Icon name="arrow-left" size={14} color={colors.muted} />
              <Text style={s.backLinkText}>뒤로</Text>
            </TouchableOpacity>
            <Text style={s.pageTitle}>OCR 인식 결과 확인</Text>
          </View>
          <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('GuideLoading')}>
            <Icon name="wand" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: typography.fz13, fontWeight: typography.fw6, marginLeft: 4 }}>가이드 생성하기</Text>
          </TouchableOpacity>
        </View>

        {/* 이미지 미리보기 */}
        {!imageRemoved ? (
          <View style={[s.card, { marginBottom: 14 }]}>
            <View style={s.docPreview}>
              <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
              <TouchableOpacity onPress={() => { setImageRemoved(true); flash('이미지를 제거했습니다'); }} style={s.removeBtn}>
                <Icon name="x" size={14} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>{ocrSession.fileName}</Text>
              <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{ocrSession.fileSize}</Text>
            </View>
          </View>
        ) : (
          <View style={[s.card, { marginBottom: 14, alignItems: 'center', paddingVertical: 24 }]}>
            <Icon name="image" size={24} color={colors.muted2} />
            <Text style={{ fontSize: typography.fz13, color: colors.muted, marginTop: 8 }}>원본 이미지를 제거했어요</Text>
            <TouchableOpacity onPress={() => setImageRemoved(false)} style={{ marginTop: 4 }}>
              <Text style={{ fontSize: typography.fz12, color: colors.accent }}>되돌리기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 완료 배너 */}
        <View style={[s.banner, s.bannerSuccess, { marginBottom: 14 }]}>
          <Icon name="check-circle" size={16} color={colors.success} />
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink, marginLeft: 8 }}>OCR 인식이 완료됐어요</Text>
        </View>

        {/* 약품 목록 */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>인식된 약품 ({ocrSession.drugs.length}종)</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('DrugSearch', { isNew: true, from: 'OCRResult' })}>
              <Text style={{ fontSize: typography.fz13, color: colors.accent }}>+ 직접 추가</Text>
            </TouchableOpacity>
          </View>

          {ocrSession.drugs.map((d, i) => {
            const warn = d.status === 'needsCheck';
            return (
              <View key={i} style={[s.drugCard, { backgroundColor: warn ? colors.warning50 : colors.success50 }]}>
                <View style={[s.drugDot, { backgroundColor: warn ? colors.warning : colors.success }]}>
                  {warn ? <Icon name="alert" size={14} color="#fff" /> : <Icon name="check" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{d.name}</Text>
                    <Text style={{ fontSize: typography.fz12, color: colors.muted }}>({d.maker})</Text>
                  </View>
                  <Text style={{ fontSize: typography.fz12, color: warn ? '#92400E' : '#065F46', marginTop: 2 }}>
                    {warn ? `인식률 ${d.confidence}% — 확인이 필요해요` : d.time}
                  </Text>
                </View>
                {/* 버튼 영역 */}
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <TouchableOpacity
                    style={s.editBtn}
                    onPress={() => navigation.navigate('DrugDosage', { drugIndex: i, from: 'OCRResult' })}>
                    <Icon name="edit" size={11} color={colors.ink2} />
                    <Text style={{ fontSize: typography.fz11, color: colors.ink2, fontWeight: typography.fw5, marginLeft: 3 }}>수정</Text>
                  </TouchableOpacity>
                  {warn && (
                    <TouchableOpacity
                      style={s.searchBtn}
                      onPress={() => navigation.navigate('DrugSearch', { drugIndex: i })}>
                      <Text style={{ fontSize: typography.fz11, color: '#fff', fontWeight: typography.fw6 }}>검색</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[s.editBtn, { borderColor: colors.danger }]}
                    onPress={() => deleteDrug(i)}>
                    <Icon name="trash" size={11} color={colors.danger} />
                    <Text style={{ fontSize: typography.fz11, color: colors.danger, fontWeight: typography.fw5, marginLeft: 3 }}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* 기록 저장 버튼 */}
        <TouchableOpacity
          style={[s.btnPrimary, { height: 50, marginBottom: spacing.s8 }]}
          onPress={() => {
            flash('진료기록이 저장됐어요.');
            setOcrSession({ fileName: '', fileSize: '', drugs: [] });
            navigation.navigate('RecordList');
          }}
          activeOpacity={0.85}>
          <Icon name="check" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: typography.fz15, fontWeight: typography.fw7, marginLeft: 6 }}>기록 저장하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── SearchBar (DrugSearchScreen 전용) ───────────────────────────────────────

function SearchBar({ query, onChangeQuery, onSearch }: { query: string; onChangeQuery: (v: string) => void; onSearch: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[sb.wrap, focused && sb.wrapFocused]}>
      <Icon name="search" size={16} color={focused ? colors.accent : colors.muted} />
      <TextInput
        style={[sb.input, { outlineWidth: 0, outlineStyle: 'none' } as any]}
        value={query}
        onChangeText={onChangeQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        placeholder="약품명·성분명·제조사 검색"
        placeholderTextColor={colors.muted}
      />
      <TouchableOpacity
        style={sb.searchBtn}
        onPress={onSearch}
        activeOpacity={0.85}>
        <Text style={{ color: '#fff', fontSize: typography.fz13, fontWeight: typography.fw6 }}>검색</Text>
      </TouchableOpacity>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    paddingLeft: spacing.s4,
    paddingRight: 6,
    height: 48,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  wrapFocused: {
    borderColor: colors.accent,
  },
  input: {
    flex: 1,
    fontSize: typography.fz14,
    color: colors.ink,
    height: 48,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── DrugSearchScreen ─────────────────────────────────────────────────────────

export function DrugSearchScreen({ navigation, route }: any) {

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const isNew      = route?.params?.isNew      || false;
  const drugIndex  = route?.params?.drugIndex;

  // 초기 쿼리: 기존 약품 수정 시 이름으로 미리 채워줌
  useEffect(() => {
    // 검색 없이 전체 목록 보여주기 위해 빈값 유지
  }, []);

  const ALL_DRUGS = [
    { name: '노바스크정 5mg',   maker: '한국화이자제약', ingredient: 'Amlodipine besylate 5mg',  code: '#643700448' },
    { name: '암로디핀정 5mg',   maker: '한미약품',       ingredient: 'Amlodipine besylate 5mg',  code: '#642902218' },
    { name: '암로핀정 5mg',     maker: '유한양행',       ingredient: 'Amlodipine besylate 5mg',  code: '#642605438' },
    { name: '로수바스타틴 10mg', maker: '한미약품',       ingredient: 'Rosuvastatin calcium 10mg', code: '#651200112' },
    { name: '메트포르민정 500mg', maker: '대웅제약',      ingredient: 'Metformin HCl 500mg',       code: '#621400230' },
    { name: '아스피린프로텍트정 100mg', maker: '바이엘코리아', ingredient: 'Aspirin 100mg',        code: '#670100100' },
  ];

  const filtered = query.trim()
    ? ALL_DRUGS.filter(d =>
        d.name.includes(query) || d.maker.includes(query) || d.ingredient.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_DRUGS;

  const handleSelect = (c: typeof ALL_DRUGS[0]) => {
    navigation.navigate('DrugDosage', {
      name: c.name, ingredient: c.ingredient, maker: c.maker,
      drugIndex: isNew ? -1 : drugIndex,
      isNew,
      from: 'DrugSearch',
    });
  };

  return (
    <View style={s.root}>
      <BellButton />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 페이지 헤더 */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backLink}>
              <Icon name="arrow-left" size={14} color={colors.muted} />
              <Text style={s.backLinkText}>OCR 결과로 돌아가기</Text>
            </TouchableOpacity>
            <Text style={s.pageTitle}>약품 검색</Text>
            <Text style={s.pageSubtitle}>처방받은 정확한 제품을 선택해 주세요.</Text>
          </View>
        </View>

        {/* 검색창 */}
        <SearchBar query={query} onChangeQuery={setQuery} onSearch={() => {}} />

        <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: 10 }}>
          {query.trim() ? `검색 결과 ${filtered.length}건` : `전체 ${filtered.length}건`}
        </Text>

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Icon name="search" size={36} color={colors.muted2} />
            <Text style={{ fontSize: typography.fz14, color: colors.muted }}>검색 결과가 없어요</Text>
          </View>
        ) : (
          filtered.map((c, i) => (
          <View key={i} style={[s.card, { marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}>{c.name}</Text>
              <Text style={{ fontSize: typography.fz11, color: colors.muted }}>{c.code}</Text>
            </View>
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginBottom: 4 }}>성분: {c.ingredient}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <Icon name="building" size={11} color={colors.accent} />
              <Text style={{ fontSize: typography.fz12, color: colors.accent }}>{c.maker}</Text>
            </View>
            <TouchableOpacity style={s.btnPrimary} onPress={() => handleSelect(c)}>
              <Text style={{ color: '#fff', fontSize: typography.fz14, fontWeight: typography.fw6 }}>이 약품 선택</Text>
            </TouchableOpacity>
          </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── DrugDosageScreen (DoseInput 디자인 적용) ────────────────────────────────

const FREQ    = ['1회', '2회', '3회', '4회'];
const TIMING  = ['식전 30분', '식후 30분', '식전 즉시', '식후 즉시', '취침 전', '공복'];
const PERIOD  = ['7일', '14일', '30일', '60일', '90일', '장기복용'];

export function DrugDosageScreen({ navigation, route }: any) {
  const { flash, ocrSession, setOcrSession } = useApp();

  const drugIndex  = route?.params?.drugIndex  ?? -1;
  const isNew      = route?.params?.isNew      || false;
  const from       = route?.params?.from       || 'DrugSearch';
  const name       = route?.params?.name       || '메트포르민정 500mg';
  const ingredient = route?.params?.ingredient || 'Metformin';
  const maker      = route?.params?.maker      || 'A제약';

  // 기존 약품이면 저장된 복용법 파싱해서 초기값으로
  const existingDrug = !isNew && drugIndex >= 0 ? ocrSession.drugs[drugIndex] : null;
  const parseTime = (time: string) => {
    // "1일 3회 · 식후 30분" 형태에서 추출
    const freqMatch  = time?.match(/(\d회)/);
    const timingMatch = TIMING.find(t => time?.includes(t));
    return { freq: freqMatch?.[1] || '3회', timing: timingMatch || '식후 30분' };
  };
  const parsed = existingDrug ? parseTime(existingDrug.time || '') : { freq: '3회', timing: '식후 30분' };

  const [freq,   setFreq]   = useState(parsed.freq);
  const [timing, setTiming] = useState(parsed.timing);
  const [period, setPeriod] = useState('14일');

  const save = () => {
    const newDrug = { name, maker, status: 'ok' as const, time: `1일 ${freq} · ${timing} · ${period}`, confidence: 100 };
    if (isNew) {
      // 신규 추가: drugs 배열에 push
      setOcrSession({
        ...ocrSession,
        drugs: [...ocrSession.drugs, newDrug],
      });
    } else {
      // 기존 수정: 해당 index만 교체
      setOcrSession({
        ...ocrSession,
        drugs: ocrSession.drugs.map((d, idx) =>
          idx === drugIndex ? { ...d, ...newDrug } : d
        ),
      });
    }
    flash('복용법을 저장했어요');
    navigation.navigate('OCRResult');
  };

  const goBack = () => {
    if (from === 'OCRResult') navigation.navigate('OCRResult');
    else navigation.navigate('DrugSearch');
  };

  const backLabel = from === 'OCRResult' ? 'OCR 결과로 돌아가기' : '약품 검색으로 돌아가기';

  return (
    <View style={s.root}>
      <BellButton />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 페이지 헤더 */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderLeft}>
            <TouchableOpacity onPress={goBack} style={s.backLink}>
              <Icon name="arrow-left" size={14} color={colors.muted} />
              <Text style={s.backLinkText}>{backLabel}</Text>
            </TouchableOpacity>
            <Text style={s.pageTitle}>복용법 입력</Text>
            <Text style={s.pageSubtitle}>OCR 인식값이 자동으로 채워졌어요. 내용을 확인하고 필요시 수정해 주세요.</Text>
          </View>
        </View>

        {/* 선택된 약품 카드 */}
        <View style={[s.card, { marginBottom: 12 }]}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.success50, marginBottom: 8 }}>
            <Text style={{ color: colors.success, fontWeight: typography.fw7, fontSize: typography.fz11 }}>선택됨</Text>
          </View>
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink, marginBottom: 4 }}>{name}</Text>
          <Text style={{ fontSize: typography.fz12, color: colors.muted }}>성분: {ingredient} | 제조사: {maker}</Text>
        </View>

        {/* OCR 경고 배너 */}
        <View style={[s.banner, s.bannerWarn, { marginBottom: 14 }]}>
          <Icon name="alert" size={14} color={colors.warning} />
          <Text style={{ fontSize: typography.fz12, color: colors.ink2, fontWeight: typography.fw6, flex: 1, marginLeft: 8 }}>
            OCR 자동 인식 결과예요. 처방전과 다른 경우 직접 수정해 주세요.
          </Text>
        </View>

        {/* 섹션 선택 + 입력 확인 + 저장 버튼 — 하나의 카드 */}
        <View style={[s.card, { marginBottom: spacing.s8 }]}>
          <DoseSection label="1일 복용 횟수" options={FREQ}   value={freq}   onChange={setFreq} />
          <DoseSection label="복용 시간"     options={TIMING} value={timing} onChange={setTiming} />
          <DoseSection label="복용 기간"     options={PERIOD} value={period} onChange={setPeriod} isLast />

          {/* 입력 확인 */}
          <View style={{ backgroundColor: colors.surface2, borderRadius: radii.md, padding: spacing.s3, marginTop: spacing.s4, marginBottom: spacing.s4 }}>
            <Text style={{ fontSize: typography.fz12, fontWeight: typography.fw7, color: colors.muted, marginBottom: 6 }}>입력 확인</Text>
            <Text style={{ fontSize: typography.fz13 }}>
              <Text style={{ color: colors.muted }}>횟수 </Text>
              <Text style={{ color: colors.accent, fontWeight: typography.fw7 }}>{freq}</Text>
              {'  '}
              <Text style={{ color: colors.muted }}>시간 </Text>
              <Text style={{ color: colors.accent, fontWeight: typography.fw7 }}>{timing}</Text>
              {'  '}
              <Text style={{ color: colors.muted }}>기간 </Text>
              <Text style={{ color: colors.accent, fontWeight: typography.fw7 }}>{period}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[s.btnPrimary, { height: 50 }]}
            onPress={save}
            activeOpacity={0.85}>
            <Text style={{ color: '#fff', fontSize: typography.fz15, fontWeight: typography.fw7 }}>복용법 저장하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DoseSection({ label, options, value, onChange, isLast }: { label: string; options: string[]; value: string; onChange: (v: string) => void; isLast?: boolean }) {
  return (
    <View style={{ marginBottom: isLast ? 0 : 20, paddingBottom: isLast ? 0 : 20, borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: colors.hairline }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: typography.fz12, fontWeight: typography.fw7, color: colors.muted }}>{label}</Text>
        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: colors.accent50 }}>
          <Text style={{ fontSize: 10, color: colors.accent700, fontWeight: typography.fw6 }}>선택</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => {
          const active = o === value;
          return (
            <TouchableOpacity
              key={o}
              onPress={() => onChange(o)}
              style={[s.chip, active && s.chipActive, { paddingHorizontal: 12, paddingVertical: 8 }]}>
              <Text style={[{ fontSize: typography.fz13 }, active && { color: colors.accent700, fontWeight: typography.fw6 }]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },

  // 로딩 화면 중앙 정렬
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.s5,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },

  // 벨 버튼

  // 스크롤 콘텐츠 — maxWidth 920 중앙 정렬
  scrollContent: {
    padding: spacing.s5,
    maxWidth: 920,
    alignSelf: 'center' as any,
    width: '100%',
  },

  // 페이지 헤더
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.s5,
  },
  pageHeaderLeft: { flex: 1, marginRight: spacing.s3 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  pageSubtitle: { fontSize: typography.fz13, color: colors.muted, marginTop: 4 },

  // 뒤로가기 텍스트 링크
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  backLinkText: { fontSize: typography.fz13, color: colors.muted },

  // 카드
  card: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.s4,
    borderWidth: 0.5, borderColor: colors.hairline,
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
  bannerWarn:    { backgroundColor: colors.warning50 },
  docPreview: { height: 140, backgroundColor: colors.accent50, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute' as any, top: 8, right: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },

  // 약품 행
  drugCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.md, marginBottom: 8 },
  drugDot: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  // 약품 버튼
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
  },
  searchBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.warning,
  },

  // 칩
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },

  // 버튼
  btnPrimary: { flexDirection: 'row', backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },

  // OCRProcessing 전용
  spinnerWrap: { width: 84, height: 84, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, alignSelf: 'stretch' },
  stepDot: { width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },

  // 삭제된 스타일 (호환성)
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.s4, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.hairline },
});

export default OCRProcessingScreen;
