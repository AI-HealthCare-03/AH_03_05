import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_guideShared';

export function GuideResultScreen({ navigation }: any) {
  const [tab, setTab] = useState<'med' | 'life'>('med');
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const { flash } = useApp();

  // TODO: [BE 대기] GET /guides/{guide_id} 백엔드 미구현 — 구현 완료 후 아래 정적 데이터를 API 응답으로 교체 필요
  const schedule = [
    { time: '08:30', label: '아침 식후 30분', drug: '암로디핀정 5mg', color: '#0EA5E9' },
    { time: '12:30', label: '점심 식후 30분', drug: '메트포르민 500mg', color: '#10B981' },
    { time: '19:00', label: '저녁 식후 30분', drug: '메트포르민 500mg, 로수바스타틴 10mg', color: '#8B5CF6' },
  ];
  const warnings = [
    { title: '자몽 및 자몽주스', body: '암로디핀의 체내 농도를 높여 혈압이 과도하게 떨어질 수 있습니다.' },
    { title: '고지방 식사', body: '스타틴 계열의 흡수를 방해하고 콜레스테롤 수치를 악화시킵니다.' },
    { title: '과도한 음주', body: '간 손상 위험을 높이고 혈압 조절을 방해할 수 있습니다.' },
  ];
  const medSteps = ['복용 시간을 매일 같은 시간으로 지켜주세요.', '두통, 발목 부종이 생기면 의사에게 알려주세요.', '다른 약과 함께 먹기 전에 약사와 상의하세요.'];

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const lifeItems = [
    { id: 'salt', title: '나트륨 2,000mg 이하 저염식 실천하기', sub: '국물은 남기고, 소금 대신 레몬이나 식초로 간을 맞추세요.' },
    { id: 'walk', title: '주 5회, 30분 이상 빠르게 걷기', sub: '숨이 약간 찰 정도의 강도로 유산소 운동을 해주세요.' },
    { id: 'stroll', title: '식후 1시간 뒤 가벼운 산책하기', sub: '당뇨 관리를 위해 식사 후 급격한 혈당 상승을 방지합니다.' },
  ];

  return (
    <ScreenLayout
      title="복약 · 생활습관 가이드"
      subtitle="2026.05.01 생성 · 고혈압·당뇨 기준"
      right={
        <Button variant="ghost" size="sm" leftIcon="chat" onPress={() => navigation.getParent()?.navigate('ChatTab', { screen: 'ChatList' })}>챗봇에 물어보기</Button>
      }
      scrollable
    >
      {/* 상단 의료 안전 고지 (REQ-SAFE-001 필수) */}
      <View style={{ backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14, borderWidth: 1, borderColor: colors.accent100 }}>
        <Icon name="info" size={16} color={colors.accent700} />
        <Text style={{ fontSize: typography.fz13, color: colors.accent700, flex: 1, lineHeight: 20 }}>
          본 안내는 참고용이며 의료인의 진단·처방·복약지도를 대체하지 않습니다. 복약 변경 전 반드시 담당 의사·약사와 상담하세요.
        </Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, tab === 'med' && s.tabBtnActive]} onPress={() => setTab('med')}>
          <Text style={[s.tabText, tab === 'med' && s.tabTextActive]}>💊 복약 안내</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'life' && s.tabBtnActive]} onPress={() => setTab('life')}>
          <Text style={[s.tabText, tab === 'life' && s.tabTextActive]}>🚶 생활습관</Text>
        </TouchableOpacity>
      </View>

      {tab === 'med' ? (
        <>
          {/* Schedule */}
          <Card style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.s12 }}>
              <Icon name="clock" size={14} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>추천 복약 시간표</Text>
            </View>
            {schedule.map((sc, i) => (
              <View key={i} style={[s.scheduleRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
                <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: sc.color, width: 52 }}>{sc.time}</Text>
                <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, flex: 1 }}>{sc.label}</Text>
                <Text style={{ fontSize: typography.fz11, color: colors.muted, flex: 1, textAlign: 'right' }} numberOfLines={2}>{sc.drug}</Text>
              </View>
            ))}
          </Card>

          {/* Warnings */}
          <Card style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.s12 }}>
              <Icon name="ban" size={14} color={colors.danger} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>주의/금기 식품</Text>
            </View>
            {warnings.map((w, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.s12, marginBottom: i < warnings.length - 1 ? spacing.s12 : 0 }}>
                <View style={{ width: 22, height: 22, borderRadius: radii.pill, backgroundColor: colors.danger50, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="alert" size={11} color={colors.danger} />
                </View>
                <Text style={{ fontSize: typography.fz13, flex: 1, color: colors.ink2 }}>
                  <Text style={{ color: colors.danger, fontWeight: typography.fw6 }}>{w.title}: </Text>{w.body}
                </Text>
              </View>
            ))}
          </Card>

          {/* Steps */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.s12 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>상세 복약 안내</Text>
            </View>
            {medSteps.map((st, i) => (
              <View key={i} style={[s.scheduleRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
                <View style={{ width: 22, height: 22, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginRight: spacing.s12 }}>
                  <Text style={{ fontSize: typography.fz11, fontWeight: typography.fw7, color: colors.accent700 }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: typography.fz13, flex: 1, color: colors.ink }}>{st}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.s12 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>고혈압·당뇨 관리 실천 체크리스트</Text>
            </View>
            {lifeItems.map(it => (
              <TouchableOpacity key={it.id} style={{ flexDirection: 'row', gap: spacing.s12, alignItems: 'flex-start', paddingVertical: 10 }}
                onPress={() => setChecks(c => ({ ...c, [it.id]: !c[it.id] }))}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: checks[it.id] ? colors.accent : colors.hairlineStrong, backgroundColor: checks[it.id] ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  {checks[it.id] && <Icon name="check" size={12} color={colors.white} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink }}>{it.title}</Text>
                  <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{it.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
          <Card style={{ backgroundColor: colors.accent50, borderColor: colors.accent100 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="link" size={14} color={colors.accent700} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.accent700 }}>출처: 대한고혈압학회 2023 / 대한당뇨병학회</Text>
            </View>
          </Card>
        </>
      )}

      {/* 응급 증상 안내 박스 (REQ-SAFE-001 필수) */}
      <View style={{ backgroundColor: colors.danger50, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.danger, marginTop: spacing.s8, marginBottom: 14 }}>
        <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw7, color: colors.danger, marginBottom: 6 }}>⚠️ 즉시 응급실 방문이 필요한 증상</Text>
        <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 }}>
          심한 흉통, 호흡곤란, 검은 변, 의식 변화, 심한 출혈이 발생하면 즉시 119에 연락하거나 응급실로 가세요.
        </Text>
      </View>

      {/* 하단 의료 안전 고지 (REQ-SAFE-001 필수) */}
      <View style={{ backgroundColor: colors.surface2, borderRadius: radii.md, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: colors.hairline }}>
        <Text style={{ fontSize: typography.fz12, color: colors.muted, textAlign: 'center', lineHeight: 18 }}>
          본 안내는 의료인의 진단·처방·복약지도를 대체하지 않습니다.{'\n'}이상 증상이 있으면 즉시 의료기관을 방문하세요.
        </Text>
      </View>

      {/* 피드백 (REQ-FB-001) */}
      <Card style={{ alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2 }}>이 가이드가 도움이 됐나요?</Text>
        <View style={{ flexDirection: 'row', gap: spacing.s12 }}>
          <TouchableOpacity
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1, borderColor: feedback === 'good' ? colors.accent : colors.hairlineStrong, backgroundColor: feedback === 'good' ? colors.accent50 : 'transparent' }]}
            // TODO: [BE 대기] POST /guides/{guide_id}/feedback 백엔드 미구현 — 구현 완료 후 연결 필요
            onPress={() => { setFeedback('good'); flash('도움이 됐다고 알려주셨어요 😊'); }}>
            <Text style={{ fontSize: 18 }}>👍</Text>
            <Text style={{ fontSize: typography.fz13, color: feedback === 'good' ? colors.accent700 : colors.ink2, fontWeight: typography.fw6 }}>도움됨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1, borderColor: feedback === 'bad' ? colors.danger : colors.hairlineStrong, backgroundColor: feedback === 'bad' ? colors.danger50 : 'transparent' }]}
            onPress={() => { setFeedback('bad'); flash('아쉬운 점을 알려주셔서 감사해요'); }}>
            <Text style={{ fontSize: 18 }}>👎</Text>
            <Text style={{ fontSize: typography.fz13, color: feedback === 'bad' ? colors.danger : colors.ink2, fontWeight: typography.fw6 }}>별로</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScreenLayout>
  );
}

export default GuideResultScreen;
