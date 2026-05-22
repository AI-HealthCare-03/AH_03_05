import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useApp } from "../../context/AppContext";
import Icon from "../../components/Icon";
import BellButton from "../../components/BellButton";
import { colors, radii, spacing } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import UploadModal from "../../components/UploadModal";



// ─── Month calendar helpers ───────────────────────────────────────────────────

type DayStatus = "today" | "done" | "missed" | "future";

function useMonthData(y: number, m: number): { day: number; status: DayStatus }[] {
  const days = new Date(y, m, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const today = now.getDate();
  const arr = [];
  for (let d = 1; d <= days; d++) {
    let status: DayStatus = "future";
    if (isCurrentMonth) {
      if (d < today) status = d % 7 === 1 || d === 5 || d === 11 || d === 19 ? "missed" : "done";
      else if (d === today) status = "today";
    } else if (m < now.getMonth() + 1 || y < now.getFullYear()) {
      status = d % 7 === 1 || d % 13 === 0 ? "missed" : "done";
    }
    arr.push({ day: d, status });
  }
  return arr;
}

function MonthCalendar({ y, m, data, onPrev, onNext, onDayClick, selectedDay, showTodayBtn, onToday }: any) {
  const firstDay = new Date(y, m - 1, 1).getDay();
  const weekHeads = ["일", "월", "화", "수", "목", "금", "토"];
  const blanks = Array.from({ length: firstDay });
  const colorFor = (s: DayStatus) => (s === "done" ? colors.success : s === "missed" ? colors.danger : s === "today" ? colors.accent : colors.hairlineStrong);

  return (
    <View>
      <View style={s.calHeader}>
        <TouchableOpacity onPress={onPrev} style={s.iconBtn}>
          <Icon name="chevron-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "600" }}>
            {y}년 {m}월
          </Text>
          {showTodayBtn && (
            <TouchableOpacity onPress={onToday} style={s.chipSmall}>
              <Text style={{ fontSize: 11, color: colors.accent700 }}>오늘</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onNext} style={s.iconBtn}>
          <Icon name="chevron-right" size={16} color={colors.ink2} />
        </TouchableOpacity>
      </View>
      <View style={s.calGrid}>
        {weekHeads.map((d, i) => (
          <Text key={d} style={[s.calWeekHead, { color: i === 0 ? colors.danger : i === 6 ? colors.accent700 : colors.muted }]}>
            {d}
          </Text>
        ))}
        {blanks.map((_, i) => (
          <View key={"b" + i} style={s.calCell} />
        ))}
        {data.map(({ day, status }: any) => {
          const dow = (firstDay + day - 1) % 7;
          const isToday = status === "today";
          const isSelected = selectedDay === day;
          return (
            <TouchableOpacity key={day} style={[s.calCell, isToday && s.calToday, isSelected && !isToday && s.calSelected]} onPress={() => onDayClick(day)}>
              <Text style={[s.calDayText, isToday && { color: "#fff" }, isSelected && !isToday && { color: colors.accent700, fontWeight: "700" }, dow === 0 && !isToday && { color: colors.danger }, dow === 6 && !isToday && { color: colors.accent700 }]}>{day}</Text>
              <View style={{ width: status === "missed" ? 4 : 16, height: 3, borderRadius: 999, marginTop: 4, backgroundColor: isToday ? "rgba(255,255,255,0.6)" : colorFor(status) }} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { user, drugs, setDrugs, adherence, streak, chats, flash, pendingUpload, setPendingUpload } = useApp();
  const { isDesktop } = useBreakpoint();
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (pendingUpload) {
      setUploadOpen(true);
      setPendingUpload(false);
    }
  }, [pendingUpload]);

  const now = new Date();
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const monthData = useMonthData(viewY, viewM);

  const isOnRealToday = viewY === now.getFullYear() && viewM === now.getMonth() + 1 && selectedDay === now.getDate();
  const selectedStatus = monthData.find((x) => x.day === selectedDay)?.status || "future";

  // 달성률: 현재 월 기준 지난 날(done+missed) 중 done 비율
  const isCurrentMonth = viewY === now.getFullYear() && viewM === now.getMonth() + 1;
  const pastDays = monthData.filter(d => d.status === 'done' || d.status === 'missed');
  const doneDays = monthData.filter(d => d.status === 'done');
  const computedAdherence = pastDays.length > 0
    ? Math.round(doneDays.length / pastDays.length * 100)
    : adherence;

  const shiftMonth = (delta: number) => {
    let m = viewM + delta, y = viewY;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setViewY(y); setViewM(m);
    const isCurrentM = y === now.getFullYear() && m === now.getMonth() + 1;
    setSelectedDay(isCurrentM ? now.getDate() : 1);
  };

  const markDose = (id: string) => {
    setDrugs(drugs.map((d) => (d.id === id ? { ...d, status: "완료" } : d)));
    flash("복약 체크 완료 🎉");
  };

  const drugsForDay = selectedStatus === "today" ? drugs
    : selectedStatus === "done"   ? drugs.map((d) => ({ ...d, status: "완료" }))
    : selectedStatus === "missed" ? drugs.map((d, i) => ({ ...d, status: i === 1 ? "미복용" : "완료" }))
    : drugs.map((d) => ({ ...d, status: "예정" }));

  const dayCompleted = drugsForDay.filter((d) => d.status === "완료").length;
  const recentChat = chats[0];
  const lastAiMsg = recentChat?.messages.filter(m => m.from === 'ai').slice(-1)[0]?.text || '';

  const dateStr = `${viewY}.${String(viewM).padStart(2, '0')}.${String(selectedDay).padStart(2, '0')}`;
  const donePastDay = selectedStatus === 'done' && !isOnRealToday;
  const missedPastDay = selectedStatus === 'missed' && !isOnRealToday;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <BellButton />

      <ScrollView contentContainerStyle={[
        { padding: spacing.s4, paddingTop: 20 },
        isDesktop && { maxWidth: 920, alignSelf: 'center' as any, width: '100%' },
      ]}>
        {/* 인사 — Image 2: 카드 없이 직접 표시 */}
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 4 }}>
          안녕하세요, {user.name}님 👋
        </Text>
        {/* 컨디션 칩 — conditions 있을 때만 표시 */}
        {!!user.conditions && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.s3 }}>
          {user.conditions
            .split(/,\s*/).filter(Boolean).slice(0, 4)
            .map((c, i) => {
              const CHIP_PALETTE = [
                { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
                { bg: colors.accent50, text: colors.accent700, border: colors.accent100 },
                { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
                { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
              ];
              const palette = CHIP_PALETTE[i % CHIP_PALETTE.length];
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => navigation.navigate('GuideResult')}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }}>
                  <Text style={{ fontSize: 12, color: palette.text, fontWeight: '500' }}>{c} 관리</Text>
                </TouchableOpacity>
              );
            })}
        </View>
        )}

        {/* 복약 달성률 + 최근 상담 — 모바일: 세로 스택 / 데스크탑: 가로 */}
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 10, marginBottom: 10 }}>
          {/* 달성률 카드 */}
          <View style={[s.card, {
            flex: isDesktop ? 2 : undefined,
            backgroundColor: colors.accent,
            borderColor: 'transparent',
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>5월 복약 달성률</Text>
              <View style={s.streakBadge}>
                <Text style={{ fontSize: 12 }}>🔥</Text>
                <Text style={{ fontSize: 12, color: '#92400E', marginLeft: 3 }}>{streak}일 연속 달성 중</Text>
              </View>
            </View>
            {/* % + 통계 항상 같은 행 */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff' }}>{computedAdherence}%</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4, textAlign: 'right' }} numberOfLines={1}>
                총 {Math.round(computedAdherence * 0.22)}일 완료 · 미복용 {Math.round((100 - computedAdherence) * 0.05)}일
              </Text>
            </View>
            <View style={[s.progressBg, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[s.progressFill, { width: `${computedAdherence}%` as any, backgroundColor: '#fff' }]} />
            </View>
          </View>

          {/* 최근 상담 카드 */}
          <TouchableOpacity
            style={[s.card, { flex: isDesktop ? 1 : undefined }]}
            onPress={() => recentChat && navigation.navigate('ChatTab', { screen: 'ChatSession', params: { chatId: recentChat.id } })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="chatbubbles" size={14} color={colors.accent700} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink }}>
                  최근 상담{recentChat ? ` (${recentChat.time})` : ''}
                </Text>
              </View>
              <Icon name="chevron-right" size={13} color={colors.muted2} />
            </View>
            {recentChat ? (
              <>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 4 }} numberOfLines={2}>"{recentChat.title}"</Text>
                {lastAiMsg ? <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 16 }} numberOfLines={2}>AI: {lastAiMsg}</Text> : null}
              </>
            ) : (
              <Text style={{ fontSize: 12, color: colors.muted }}>아직 상담 내역이 없어요</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 빠른 액션 — 아이콘 카드 스타일 (Image 2 목표) */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <TouchableOpacity style={[s.card, { flex: 1, paddingVertical: 14 }]} onPress={() => setUploadOpen(true)}>
            <View style={s.quickIcon}>
              <Icon name="cloud-upload" size={18} color={colors.accent700} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>의료 문서 업로드</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>처방전·약봉투·진료기록 분석</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.card, { flex: 1, paddingVertical: 14 }]} onPress={() => navigation.navigate('GuideResult')}>
            <View style={[s.quickIcon, { backgroundColor: colors.success50 }]}>
              <Icon name="doc" size={18} color={colors.success} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>최근 가이드</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>복약·생활습관 안내</Text>
          </TouchableOpacity>
        </View>

        {/* 달력 */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <MonthCalendar
            y={viewY} m={viewM} data={monthData}
            onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)}
            onDayClick={setSelectedDay} selectedDay={selectedDay}
            showTodayBtn={!isOnRealToday}
            onToday={() => { setViewY(now.getFullYear()); setViewM(now.getMonth() + 1); setSelectedDay(now.getDate()); }}
          />
          {/* 범례 */}
          <View style={{ flexDirection: 'row', gap: 16, paddingTop: 12, marginTop: 8, borderTopWidth: 0.5, borderTopColor: colors.hairline }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.success }} />
              <Text style={{ fontSize: 11, color: colors.muted }}>복약 완료</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.danger }} />
              <Text style={{ fontSize: 11, color: colors.muted }}>미복용</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 14, height: 4, borderRadius: 2, backgroundColor: colors.hairlineStrong }} />
              <Text style={{ fontSize: 11, color: colors.muted }}>예정</Text>
            </View>
          </View>
        </View>

        {/* 과거 완료일 요약 카드 (Image 5) */}
        {donePastDay && (
          <View style={[s.card, { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{viewM}월 {selectedDay}일 기록</Text>
              <View style={s.badgeSuccess}><Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>복약 완료</Text></View>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted }}>처방된 약을 모두 복용했어요. 좋은 흐름을 이어가세요!</Text>
          </View>
        )}
        {missedPastDay && (
          <View style={[s.card, { marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{viewM}월 {selectedDay}일 기록</Text>
              <View style={s.badgeDanger}><Text style={{ fontSize: 12, color: colors.danger, fontWeight: '600' }}>미복용 있음</Text></View>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted }}>일부 복약이 미복용됐어요. 꾸준히 이어가 보세요!</Text>
          </View>
        )}

        {/* 복약 현황 */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>
                {selectedStatus === "today"
                  ? `오늘 복약 현황 (${dayCompleted}/${drugsForDay.length})`
                  : `복약 기록 · ${dateStr} (${dayCompleted}/${drugsForDay.length})`}
              </Text>
            </View>
            {selectedStatus === 'done' && isOnRealToday && (
              <View style={s.badgeSuccess}><Text style={{ fontSize: 11, color: colors.success, fontWeight: '600' }}>모두 복약</Text></View>
            )}
            {selectedStatus === "missed" && <View style={s.badgeDanger}><Text style={{ fontSize: 11, color: colors.danger }}>미복용 있음</Text></View>}
          </View>

          {drugsForDay.map((d, i) => (
            <View key={d.id} style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
              <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: d.color }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>{d.name}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{d.freq} · {d.time}</Text>
              </View>
              {d.status === '완료' ? (
                <View style={[s.statusDone, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Icon name="check" size={12} color={colors.success} />
                  <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>완료</Text>
                </View>
              ) : d.status === '미복용' ? (
                <View style={s.statusMissed}><Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>미복용</Text></View>
              ) : d.status === '예정' ? (
                <View style={s.statusPending}>
                  <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 12 }}>예정 · {d.time?.split(' ')[0] || d.time}</Text>
                </View>
              ) : (
                <TouchableOpacity style={s.statusPending} onPress={() => markDose(d.id)}>
                  <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 12 }}>복약 체크</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <UploadModal
        visible={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onStart={() => { setUploadOpen(false); navigation.navigate("OCRProcessing"); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  quickBtn: { flex: 1, padding: 16, borderRadius: radii.lg, alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statusDone:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.success50 },
  statusMissed:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.danger50 },
  statusPending: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accent100, backgroundColor: 'transparent' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    marginBottom: 0,
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  conditionChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.accent50, borderWidth: 1, borderColor: colors.accent100 },
  streakBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
  quickIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.accent100, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  drugRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  badgeSuccess: { backgroundColor: colors.success50, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDanger: { backgroundColor: colors.danger50, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  chipBtn: { borderWidth: 1, borderColor: colors.accent100, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  iconBtn: { width: 32, height: 32, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accent100 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calWeekHead: { width: "14.28%", textAlign: "center", fontSize: 11, paddingVertical: 4 },
  calCell: { width: "14.28%", alignItems: "center", paddingVertical: 6, borderRadius: radii.sm },
  calToday: { backgroundColor: colors.accent },
  calSelected: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: 'transparent' },
  calDayText: { fontSize: 13, color: colors.ink },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
});
