import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import BellButton from '../../components/BellButton';
import { useBreakpoint } from '../../hooks/useBreakpoint';



export function GuideLoadingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const steps = ['처방전 데이터 정리', '건강 프로필과 매칭', '복약 시간표 계산', '주의사항 추론', '생활습관 체크리스트 생성'];

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(() => navigation.replace('GuideResult'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), 600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={[s.card, { width: '90%', alignItems: 'center' }]}>
        <View style={s.spinner}>
          <Icon name="wand" size={36} color={colors.accent700} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 4 }}>맞춤 가이드를 만들고 있어요</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>건강 프로필을 기준으로 분석 중입니다.</Text>

        <View style={[s.progressBg, { alignSelf: 'stretch', marginBottom: 20 }]}>
          <View style={[s.progressFill, { width: `${Math.min(100, (step + 1) / steps.length * 100)}%` as any }]} />
        </View>

        {steps.map((st, i) => (
          <View key={st} style={[s.stepRow, { opacity: i > step ? 0.4 : 1 }]}>
            <View style={[s.stepDot, { backgroundColor: i < step ? colors.success : i === step ? colors.accent : colors.hairline }]}>
              {i < step
                ? <Icon name="check" size={12} color="#fff" />
                : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === step ? '#fff' : colors.muted2 }} />}
            </View>
            <Text style={{ fontSize: 13, flex: 1 }}>{st}</Text>
            {i === step && <Text style={{ fontSize: 12, color: colors.muted }}>처리 중...</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

export function GuideResultScreen({ navigation }: any) {
  const [tab, setTab] = useState<'med' | 'life'>('med');
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const { flash, user, notifications } = useApp();
  const { isDesktop } = useBreakpoint();


  const schedule = [
    { time: '08:30', label: '아침 식후 30분', drug: '암로디핀정 5mg (한미약품)',            color: '#0EA5E9' },
    { time: '12:30', label: '점심 식후 30분', drug: '메트포르민 500mg (대웅제약)',           color: '#10B981' },
    { time: '19:00', label: '저녁 식후 30분', drug: '메트포르민 500mg, 로수바스타틴 10mg',   color: '#8B5CF6' },
  ];
  const warnings = [
    { title: '자몽 및 자몽주스', body: '암로디핀의 체내 농도를 높여 혈압이 과도하게 떨어질 수 있습니다.' },
    { title: '고지방 식사',     body: '스타틴 계열 약품의 흡수를 방해합니다.' },
    { title: '과도한 음주',     body: '간 손상 위험을 높이고 혈압 조절을 방해합니다.' },
  ];
  const medSteps = [
    '복용 시간을 매일 같은 시간으로 지켜주세요.',
    '두통, 발목 부종이 생기면 의사에게 알려주세요.',
    '다른 약과 함께 먹기 전에 약사와 상의하세요.',
  ];
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const lifeItems = [
    { id: 'salt',   title: '나트륨 2,000mg 이하 저염식 실천하기', sub: '국물은 남기고, 소금 대신 레몬이나 식초로 간을 맞추세요.' },
    { id: 'walk',   title: '주 5회, 30분 이상 빠르게 걷기',       sub: '숨이 약간 찰 정도의 강도로 유산소 운동을 해주세요.' },
    { id: 'stroll', title: '식후 1시간 뒤 가벼운 산책하기',       sub: '식사 후 급격한 혈당 상승을 방지합니다.' },
  ];

  // 하단 안내 박스 (두 탭 공용)
  const BottomNotice = () => (
    <View style={s.noticeBox}>
      <Icon name="info" size={13} color={colors.accent700} />
      <Text style={{ fontSize: 12, color: colors.accent700, flex: 1, lineHeight: 18 }}>
        내 건강 정보를 반영한 가이드예요. 복약 변경 중단은 담당 의사와 상담해 주세요.
      </Text>
    </View>
  );

  return (
    <View style={s.root}>
      <BellButton />

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 — RecordList pageHeader 패턴 동일 */}
        <View style={s.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.screenTitle}>복약 가이드</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
              2026.05.13 생성 · {user?.name || '사용자'}님 건강 정보 반영
            </Text>
          </View>
          <TouchableOpacity style={s.btnGhost} onPress={() => navigation.navigate('ChatTab', { screen: 'ChatList' })}>
            <Icon name="chat" size={14} color={colors.ink2} />
            <Text style={{ fontSize: 13, color: colors.ink2, marginLeft: 4 }}>상담에 이 내용 물어보기</Text>
          </TouchableOpacity>
        </View>

        {/* 탭 바 — 절반 너비, 중앙 정렬 */}
        <View style={s.tabBar}>
          <TouchableOpacity style={[s.tabBtn, tab === 'med' && s.tabBtnActive]} onPress={() => setTab('med')}>
            <Text style={[s.tabText, tab === 'med' && s.tabTextActive]}>💊 복약 안내</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, tab === 'life' && s.tabBtnActive]} onPress={() => setTab('life')}>
            <Text style={[s.tabText, tab === 'life' && s.tabTextActive]}>🌿 생활습관</Text>
          </TouchableOpacity>
        </View>

        {tab === 'med' ? (
          <>
            {/* 복약 시간표 */}
            <View style={[s.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Icon name="clock" size={14} color={colors.ink2} />
                <Text style={s.sectionTitle}>추천 복약 시간표</Text>
              </View>
              {schedule.map((sc, i) => (
                <View key={i} style={[s.scheduleRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: sc.color, width: 52 }}>{sc.time}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', flex: 1 }}>{sc.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, flex: 1, textAlign: 'right' }} numberOfLines={2}>{sc.drug}</Text>
                </View>
              ))}
            </View>

            {/* 주의/금기 식품 */}
            <View style={[s.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Icon name="ban" size={14} color={colors.danger} />
                <Text style={s.sectionTitle}>주의/금기 식품</Text>
              </View>
              {warnings.map((w, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: i < warnings.length - 1 ? 12 : 0 }}>
                  <View style={s.warnIcon}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.danger }}>!</Text>
                  </View>
                  <Text style={{ fontSize: 13, flex: 1, color: colors.ink2, lineHeight: 20 }}>
                    <Text style={{ color: colors.danger, fontWeight: '600' }}>{w.title}: </Text>{w.body}
                  </Text>
                </View>
              ))}
            </View>

            {/* 상세 복약 안내 */}
            <View style={[s.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Icon name="link" size={14} color={colors.ink2} />
                <Text style={s.sectionTitle}>상세 복약 안내</Text>
              </View>
              {medSteps.map((st, i) => (
                <View key={i} style={[s.scheduleRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
                  <View style={s.stepNum}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent700 }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 13, flex: 1, color: colors.ink }}>{st}</Text>
                </View>
              ))}
            </View>

            <BottomNotice />
          </>
        ) : (
          <>
            {/* 실천 체크리스트 */}
            <View style={[s.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Icon name="link" size={14} color={colors.ink2} />
                <Text style={s.sectionTitle}>실천 체크리스트</Text>
              </View>
              {lifeItems.map((it, i) => (
                <TouchableOpacity
                  key={it.id}
                  style={[{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10 }, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
                  onPress={() => setChecks(c => ({ ...c, [it.id]: !c[it.id] }))}>
                  <View style={[s.checkbox, checks[it.id] && s.checkboxDone]}>
                    {checks[it.id] && <Icon name="check" size={12} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{it.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{it.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <BottomNotice />
          </>
        )}

        {/* 피드백 */}
        <View style={s.card}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 14, textAlign: 'center' }}>
            이 가이드가 도움이 되었나요?
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[s.feedbackBtn, feedback === 'good' && { borderColor: colors.accent, backgroundColor: colors.accent50 }]}
              onPress={() => { setFeedback('good'); flash('도움이 됐다고 알려주셨어요 😊'); }}>
              <Text style={{ fontSize: 16 }}>👍</Text>
              <Text style={[s.feedbackText, feedback === 'good' && { color: colors.accent700 }]}>도움됐어요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.feedbackBtn, feedback === 'bad' && { borderColor: colors.danger, backgroundColor: colors.danger50 }]}
              onPress={() => { setFeedback('bad'); flash('아쉬운 점을 알려주셔서 감사해요'); }}>
              <Text style={{ fontSize: 16 }}>👎</Text>
              <Text style={[s.feedbackText, feedback === 'bad' && { color: colors.danger }]}>별로예요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.canvas },

  // 헤더 (RecordList pageHeader 패턴)
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.s4,
    gap: spacing.s4,
  },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  btnGhost: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.hairline,
    borderRadius: radii.pill,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },

  // 알림 벨

  // 스크롤 콘텐츠
  scrollContent: {
    paddingHorizontal: spacing.s5,
    paddingTop: 28,
    paddingBottom: spacing.s6,
  },
  scrollContentDesktop: {
    maxWidth: 920,
    alignSelf: 'center' as any,
    width: '100%',
  },

  // 탭 — 절반 너비, 중앙 정렬
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    alignSelf: 'center' as any,
    width: 360,
  },
  tabBtn:       { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  tabBtnActive: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accent,
    shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabText:       { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.accent700 },

  // 카드
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },

  // 복약 시간표 행
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },

  // 경고 아이콘 (빨간 원형 !)
  warnIcon: {
    width: 22, height: 22, borderRadius: 999,
    backgroundColor: colors.danger50,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // 번호 뱃지
  stepNum: {
    width: 22, height: 22, borderRadius: 999,
    backgroundColor: colors.accent50,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },

  // 체크박스
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.hairlineStrong, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxDone: { borderColor: colors.accent, backgroundColor: colors.accent },

  // 하단 안내 박스
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent50,
    borderRadius: radii.md, padding: 12,
    marginBottom: 12,
    borderWidth: 0.5, borderColor: colors.accent100,
  },

  // 피드백 버튼
  feedbackBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  feedbackText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },

  // 로딩 화면
  spinner:     { width: 84, height: 84, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  progressBg:  { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height: '100%' as any, backgroundColor: colors.accent, borderRadius: 3 },
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, alignSelf: 'stretch' },
  stepDot:     { width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  iconBtn:     { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

export default GuideLoadingScreen;
