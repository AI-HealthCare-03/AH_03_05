import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, useWindowDimensions } from "react-native";
import { useApp } from "../../context/AppContext";
import Icon from "../../components/Icon";
import { colors, radii, spacing } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";

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

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ visible, onClose, onStart }: { visible: boolean; onClose: () => void; onStart: () => void }) {
  const [type, setType] = useState("처방전");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  const types = [
    { id: "처방전", icon: "doc" },
    { id: "약봉투", icon: "pill" },
    { id: "진료기록", icon: "list" },
  ];
  const sources = [
    { id: "camera", label: "사진촬영", icon: "camera" },
    { id: "gallery", label: "갤러리에서 선택", icon: "image" },
    { id: "pdf", label: "PDF 업로드", icon: "file" },
    { id: "manual", label: "직접입력", icon: "keyboard" },
  ];

  const { isDesktop } = useBreakpoint();
  const { width } = useWindowDimensions();
  const cardWidth = isDesktop ? 520 : width - 40;

  const handleClose = () => {
    setUploading(false);
    setUploadProgress(0);
    setUploadDone(false);
    onClose();
  };

  const handleSourcePress = () => {
    setUploading(true);
    let p = 0;
    const iv = setInterval(() => {
      p += 25;
      setUploadProgress(p);
      if (p >= 100) {
        clearInterval(iv);
        setUploadDone(true);
        setTimeout(() => { handleClose(); onStart(); }, 700);
      }
    }, 250);
  };

  const ModalContent = () => (
    <>
      {!isDesktop && <View style={s.modalHandle} />}
      <View style={s.modalHead}>
        <View>
          <Text style={s.modalTitle}>의료 문서 업로드</Text>
          <Text style={s.modalSub}>어떤 문서를 분석할까요?</Text>
        </View>
        {/* 원형 닫기 버튼 */}
        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
          <Icon name="x" size={15} color={colors.accent700} />
        </TouchableOpacity>
      </View>

      {uploading ? (
        /* 업로드 진행 상태 */
        <View style={{ paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: uploadDone ? colors.success : colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={uploadDone ? 'check' : 'camera'} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
                {uploadDone ? '업로드 완료' : '업로드 중...'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {uploadDone ? '분석 화면으로 이동합니다.' : '잠시만 기다려주세요.'}
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.accent }}>{uploadProgress}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${uploadProgress}%` as any }]} />
          </View>
        </View>
      ) : (
        <>
          {/* 문서 유형 선택 */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            {types.map((t) => (
              <TouchableOpacity key={t.id} style={[s.typeCard, type === t.id && s.typeCardActive]} onPress={() => setType(t.id)}>
                <View style={[s.typeIcon, { backgroundColor: type === t.id ? colors.accent100 : colors.surface2 }]}>
                  <Icon name={t.icon} size={14} color={type === t.id ? colors.accent700 : colors.muted} />
                </View>
                <Text style={[{ fontSize: 12, fontWeight: "600" }, type === t.id && { color: colors.accent700 }]}>{t.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 업로드 소스 — 2×2 그리드 */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            {sources.map((src) => (
              <TouchableOpacity
                key={src.id}
                style={[s.srcCard, { width: (cardWidth - 52) / 2 }]}
                onPress={handleSourcePress}>
                <View style={s.srcIcon}>
                  <Icon name={src.icon} size={16} color={colors.accent700} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600" }}>{src.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>
            JPG · PNG · PDF / 최대 10MB · 원본은 90일 후 자동 삭제
          </Text>
        </>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={s.scrimCenter} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={[s.modalCenter, { width: cardWidth }]} onPress={() => {}}>
            <ModalContent />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modal} onPress={() => {}}>
          <ModalContent />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { user, drugs, setDrugs, adherence, streak, chats, flash, notifications, pendingUpload, setPendingUpload } = useApp();
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
  const unread = notifications?.some(n => n.unread);
  const unreadCount = notifications?.filter(n => n.unread).length || 0;

  const dateStr = `${viewY}.${String(viewM).padStart(2, '0')}.${String(selectedDay).padStart(2, '0')}`;
  const donePastDay = selectedStatus === 'done' && !isOnRealToday;
  const missedPastDay = selectedStatus === 'missed' && !isOnRealToday;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* 벨 아이콘 — 콘텐츠 우상단 플로팅 (모바일/데스크탑 공통) */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, width: 38, height: 38, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }}
        onPress={() => navigation.navigate('SettingsTab', { screen: 'Notifications' })}>
        <Icon name="bell" size={18} color={colors.ink2} />
        {unread && (
          <View style={{ position: 'absolute', top: 5, right: 5, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700', lineHeight: 12 }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: spacing.s5, paddingTop: 56 }}>
        {/* 인사 + 컨디션 칩 */}
        <Text style={{ fontSize: 26, fontWeight: "700", color: colors.ink, marginBottom: 8 }}>안녕하세요, {user.name}님 👋</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.s5 }}>
          {(user.conditions || "고혈압, 제2형 당뇨")
            .split(/,\s*/).filter(Boolean).slice(0, 4)
            .map((c, i) => (
              <TouchableOpacity key={i} onPress={() => navigation.navigate("GuideResult")} style={s.conditionChip}>
                <Text style={{ fontSize: 12, color: colors.accent700, fontWeight: '500' }}>{c} 관리</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* 복약 달성률(teal) + 최근 상담 */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
          {/* 달성률 카드 — teal 배경 */}
          <View style={[s.card, { flex: 2, backgroundColor: colors.accent, borderColor: 'transparent' }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>5월 복약 달성률</Text>
              <View style={s.streakBadge}>
                <Text style={{ fontSize: 12 }}>🔥</Text>
                <Text style={{ fontSize: 12, color: "#92400E", marginLeft: 3 }}>{streak}일 연속 달성 중</Text>
              </View>
            </View>
            <Text style={{ fontSize: 36, fontWeight: "700", color: '#fff', marginBottom: 4 }}>{adherence}%</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
              총 {Math.round(adherence * 0.22)}일 완료 · 미복용 {Math.round((100 - adherence) * 0.05)}일
            </Text>
            <View style={[s.progressBg, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[s.progressFill, { width: `${adherence}%` as any, backgroundColor: '#fff' }]} />
            </View>
          </View>

          {/* 최근 상담 카드 — 날짜 + AI 미리보기 */}
          <TouchableOpacity style={[s.card, { flex: 1 }]}
            onPress={() => recentChat && navigation.navigate("ChatTab", { screen: "ChatSession", params: { chatId: recentChat.id } })}>
            <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: "center", marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="chat" size={14} color={colors.accent700} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}>
                  최근 상담 {recentChat ? `(${recentChat.time})` : ''}
                </Text>
              </View>
              <Icon name="chevron-right" size={13} color={colors.muted2} />
            </View>
            {recentChat ? (
              <>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 4 }} numberOfLines={2}>
                  "{recentChat.title}"
                </Text>
                {lastAiMsg ? (
                  <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 16 }} numberOfLines={2}>
                    AI: {lastAiMsg}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={{ fontSize: 12, color: colors.muted }}>아직 상담 내역이 없어요</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 빠른 액션 */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: spacing.s5 }}>
          <TouchableOpacity style={[s.card, { flex: 1, paddingVertical: 20 }]} onPress={() => setUploadOpen(true)}>
            <View style={s.quickIcon}>
              <Icon name="camera" size={22} color={colors.accent700} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.ink }}>의료 문서 업로드</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>처방전·약봉투·진료기록 분석</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.card, { flex: 1, paddingVertical: 20 }]} onPress={() => navigation.navigate("GuideResult")}>
            <View style={s.quickIcon}>
              <Icon name="doc" size={22} color={colors.accent700} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.ink }}>최근 가이드</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>복약·생활습관 안내</Text>
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
                {selectedStatus === "today" ? "오늘 복약 현황" : selectedStatus === "future" ? "예정된 복약" : "복약 기록"}
                <Text style={{ color: colors.muted, fontWeight: '400' }}> · {dateStr}</Text>
                {' '}({dayCompleted}/{drugsForDay.length})
              </Text>
            </View>
            {selectedStatus === "missed" && <View style={s.badgeDanger}><Text style={{ fontSize: 11, color: colors.danger }}>미복용 있음</Text></View>}
            {selectedStatus === "done"   && <View style={s.badgeSuccess}><Text style={{ fontSize: 11, color: colors.success }}>모두 복약</Text></View>}
          </View>

          {drugsForDay.map((d, i) => (
            <View key={d.id} style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
              <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: d.color }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>{d.name}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{d.freq} · {d.time}</Text>
              </View>
              {d.status === "완료" ? (
                <View style={s.badgeSuccess}><Text style={{ fontSize: 11, color: colors.success }}>완료</Text></View>
              ) : d.status === "미복용" ? (
                <View style={s.badgeDanger}><Text style={{ fontSize: 11, color: colors.danger }}>미복용</Text></View>
              ) : d.status === "예정" ? (
                <Text style={{ fontSize: 12, color: colors.muted }}>예정</Text>
              ) : (
                <TouchableOpacity style={s.chipBtn} onPress={() => markDose(d.id)}>
                  <Text style={{ fontSize: 12, color: colors.accent700 }}>복약 체크</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s5,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  conditionChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.accent50, borderWidth: 1, borderColor: colors.accent100 },
  streakBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
  quickIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.accent100, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  drugRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  badgeSuccess: { backgroundColor: colors.success50, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDanger: { backgroundColor: colors.danger50, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  chipBtn: { borderWidth: 1, borderColor: colors.accent100, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accent100 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calWeekHead: { width: "14.28%", textAlign: "center", fontSize: 11, paddingVertical: 4 },
  calCell: { width: "14.28%", alignItems: "center", paddingVertical: 6, borderRadius: 8 },
  calToday: { backgroundColor: colors.accent },
  calSelected: { backgroundColor: colors.accent100 },
  calDayText: { fontSize: 13, color: colors.ink },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  scrimCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  modalCenter: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.s5 },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.s5 },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.hairlineStrong, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  modalSub: { fontSize: 13, color: colors.muted },
  typeCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface2 },
  typeCardActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  typeIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  closeBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },
  srcCard: { alignItems: "center", padding: 16, borderRadius: radii.md, borderWidth: 0.5, borderColor: colors.hairline, backgroundColor: colors.surface },
  srcIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent50, alignItems: "center", justifyContent: "center", marginBottom: 8 },
});
