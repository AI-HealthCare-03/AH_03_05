// records/RecordListScreen.tsx + RecordDetailScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useApp } from "../../context/AppContext";
import Icon from "../../components/Icon";
import BellButton from "../../components/BellButton";
import UploadModal from "../../components/UploadModal";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { colors, radii, spacing, typography } from "../../theme";

// ─── 반응형 브레이크포인트 ────────────────────────────────────────────────────
// mobile  : width < 768
// tablet  : 768 ≤ width < 1280
// desktop : width ≥ 1280
// ─────────────────────────────────────────────────────────────────────────────

const iconFor = (kind: string) =>
  kind === "처방전" ? "doc" : kind === "약봉투" ? "pill" : "list";


// ─── RecordListScreen ────────────────────────────────────────────────────────
export function RecordListScreen({ navigation }: any) {
  const { records } = useApp();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [filter, setFilter] = useState("전체");
  const [uploadOpen, setUploadOpen] = useState(false);


  const tabs = ["전체", "처방전", "약봉투", "진료기록"];
  const filtered =
    filter === "전체" ? records : records.filter((r) => r.kind === filter);

  return (
    <View style={s.root}>
      <BellButton />

      <UploadModal
        visible={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onStart={() => { setUploadOpen(false); navigation.navigate("OCRProcessing"); }}
      />
      <ScrollView
        contentContainerStyle={[
          { padding: spacing.s4, paddingTop: 20 },
          isDesktop && { maxWidth: 920, alignSelf: 'center' as any, width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 페이지 헤더 ─────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          {/* 왼쪽: 제목 + 서브타이틀 */}
          <View style={s.pageHeaderLeft}>
            <Text style={s.pageTitle}>진료기록</Text>
            {!isMobile && (
              <Text style={s.pageSubtitle}>
                업로드한 의료 문서와 분석 결과를 확인할 수 있어요.
              </Text>
            )}
          </View>

          {/* 오른쪽: 필터 칩 + 업로드 버튼 — 같은 행 */}
          <View style={s.headerRight}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.chip, filter === t && s.chipActive]}
                onPress={() => setFilter(t)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, filter === t && s.chipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={s.uploadBtn}
              activeOpacity={0.85}
              onPress={() => setUploadOpen(true)}
            >
              <Icon name="camera" size={15} color={colors.accentOn} />
              <Text style={s.uploadBtnText}>
                {isMobile ? "업로드" : "새로 업로드"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 카드 리스트 ─────────────────────────────────────────────── */}
        <View style={s.cardList}>
          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Icon name="doc" size={48} color={colors.muted2} />
              <Text style={s.emptyText}>아직 업로드한 진료기록이 없어요.</Text>
            </View>
          ) : (
            filtered.map((r, i) => {
              const status = (r as any).status || (i === 1 ? '검토 필요' : '완료');
              const isReview = status === '검토 필요';
              return (
              <TouchableOpacity
                key={r.id}
                style={s.card}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate("RecordDetail", { recordId: r.id })
                }
              >
                {/* 아이콘 */}
                <View style={s.cardIcon}>
                  <Icon name={iconFor(r.kind)} size={20} color={colors.accent700} />
                </View>

                {/* 텍스트 */}
                <View style={s.cardBody}>
                  <View style={s.cardMeta}>
                    <View style={[s.statusBadge, isReview ? s.badgeReview : s.badgeDone]}>
                      <Text style={[s.statusBadgeText, { color: isReview ? '#D97706' : colors.success }]}>{status}</Text>
                    </View>
                    <Icon name="time" size={11} color={colors.muted} />
                    <Text style={s.metaDate}>{r.date}</Text>
                  </View>
                  <Text style={s.cardPlace} numberOfLines={1}>
                    {r.kind} · {r.place}
                  </Text>
                  <Text style={s.cardDrug}>
                    약품 {r.drugCount}종 인식
                  </Text>
                </View>

                {/* 화살표 */}
                <Icon name="chevron-right" size={16} color={colors.muted2} />
              </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── RecordDetailScreen ──────────────────────────────────────────────────────
export function RecordDetailScreen({ navigation, route }: any) {
  const { records, setRecords, flash } = useApp();
  const { isDesktop } = useBreakpoint();


  const record =
    records.find((r) => r.id === route?.params?.recordId) || records[0];

  const drugSeed = [
    { name: "암로디핀정 5mg",    maker: "한미약품", freq: "1일 1회", time: "아침 식후 30분" },
    { name: "로수바스타틴 10mg", maker: "유한양행", freq: "1일 1회", time: "저녁 식후" },
    { name: "메트포르민 500mg",  maker: "대웅제약", freq: "1일 2회", time: "점심·저녁 식후" },
  ];

  // 원본 보관 만료일 (발급일 + 90일)
  const expireDate = (() => {
    const base = record.date?.replace(/\./g, '-');
    const d = base ? new Date(base) : new Date();
    d.setDate(d.getDate() + 90);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  })();

  const handleDelete = () => {
    setRecords(records.filter((r) => r.id !== record.id));
    flash('기록이 삭제됐어요.');
    navigation.goBack();
  };

  const handleDownload = () => {
    if (Platform.OS === 'web') {
      try {
        const a = document.createElement('a');
        a.href = 'data:text/plain;charset=utf-8,'; // placeholder — 실제 이미지 URL로 교체
        a.download = `처방전_${record.date || 'record'}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        flash('다운로드를 시작했어요.');
      } catch {
        flash('다운로드를 준비 중이에요.');
      }
    } else {
      flash('다운로드를 준비 중이에요.');
    }
  };

  const infoItems = [
    { icon: "doc",      label: "발급 기관",    value: record.place },
    { icon: "calendar", label: "발급일",        value: record.date },
    { icon: "pill",     label: "인식 약품",     value: `${record.drugCount}종` },
    { icon: "calendar", label: "원본 보관 만료", value: expireDate },
  ];

  return (
    <View style={s.root}>
      <BellButton />
      <ScrollView
        contentContainerStyle={[
          { padding: spacing.s4, paddingTop: 20 },
          isDesktop && { maxWidth: 920, alignSelf: 'center' as any, width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 페이지 헤더 ──────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: spacing.s3 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
              <Icon name="arrow-left" size={16} color={colors.ink2} />
            </TouchableOpacity>
            <View style={s.pageHeaderLeft}>
              <Text style={s.pageTitle}>{record.place}</Text>
              <Text style={s.pageSubtitle}>{record.kind} · {record.date} 발급</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Icon name="trash" size={13} color={colors.ink2} />
              <Text style={s.deleteBtnText}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.uploadBtn} onPress={() => navigation.navigate("GuideResult")} activeOpacity={0.85}>
              <Icon name="wand" size={13} color={colors.accentOn} />
              <Text style={s.uploadBtnText}>가이드 보기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.cardList}>
          {/* 발급 정보 그리드 */}
          <View style={[s.card, s.cardColumn]}>
            <View style={s.infoGrid}>
              {infoItems.map((item, i) => (
                <View key={i} style={s.infoCell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <Icon name={item.icon} size={12} color={colors.muted} />
                    <Text style={s.infoCellLabel}>{item.label}</Text>
                  </View>
                  <Text style={s.infoCellValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 인식된 약품 */}
          <View style={[s.card, s.cardColumn]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.s3 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={s.sectionTitle}>인식된 약품</Text>
            </View>
            {drugSeed.map((d, i) => (
              <View
                key={i}
                style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}
              >
                <View style={s.drugInfo}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.drugName}>{d.name}</Text>
                    <Text style={s.metaDate}>({d.maker})</Text>
                  </View>
                  <Text style={s.drugDetail}>{d.freq} · {d.time}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 의사 메모 */}
          <View style={[s.card, s.cardColumn]}>
            <Text style={s.sectionTitle}>의사 메모</Text>
            <Text style={[s.metaDate, { marginTop: 8, lineHeight: 20 }]}>{record.note || '고혈압·당뇨 정기 처방, 14일분'}</Text>
          </View>

          {/* 원본 이미지 */}
          <View style={[s.card, s.cardColumn, { marginBottom: 0 }]}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>원본 이미지</Text>
              <TouchableOpacity onPress={handleDownload} style={s.downloadBtn} activeOpacity={0.8}>
                <Icon name="download" size={12} color={colors.accent} />
                <Text style={s.linkText}>다운로드</Text>
              </TouchableOpacity>
            </View>
            <View style={s.imagePlaceholder}>
              <Icon name="doc" size={72} color="rgba(8,145,178,0.25)" />
            </View>
            <View style={[s.sectionRow, { marginTop: 10, marginBottom: 0 }]}>
              <Text style={s.metaDate}>처방전.jpg</Text>
              <Text style={s.metaDate}>1.8MB · 업로드 {record.date}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── 공통 그림자 ──────────────────────────────────────────────────────────────
const CARD_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6 },
  android: { elevation: 2 },
  default: {},
});
const BTN_SHADOW = Platform.select({
  ios:     { shadowColor: colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
  android: { elevation: 3 },
  default: {},
});

// ─── 스타일 ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── 뒤로가기 버튼 ─────────────────────────────────────────────────────────
  backBtn: {
    width: 34, height: 34, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5, borderColor: colors.hairline,
    flexShrink: 0,
  },

  // ── 루트 ─────────────────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: colors.canvas,    // #F0F9FF
  },

  // ── ScrollView ───────────────────────────────────────────────────────────


  // ── 페이지 헤더 ───────────────────────────────────────────────────────────
  // canvas 위에 바로 올라오는 구조, 별도 surface 없음
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.s4,           // 16
  },
  pageHeaderLeft: {
    flex: 1,
    gap: 6,
    marginRight: spacing.s4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  pageSubtitle: {
    fontSize: typography.fz13,
    color: colors.muted,
    lineHeight: 18,
  },

  // ── 헤더 우측 (칩 + 버튼 묶음) ──────────────────────────────────────────
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  // ── 업로드 버튼 ───────────────────────────────────────────────────────────
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s4,      // 16
    paddingVertical: 10,
    ...BTN_SHADOW,
  },
  uploadBtnText: {
    color: colors.accentOn,
    fontSize: typography.fz13,
    fontWeight: typography.fw6,
  },

  // ── 필터 칩 ───────────────────────────────────────────────────────────────
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontSize: typography.fz13,
    color: colors.ink2,
    fontWeight: typography.fw5,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: typography.fw6,
  },

  // ── 카드 리스트 래퍼 ──────────────────────────────────────────────────────
  cardList: {
    gap: 12,
  },

  // ── 카드 공통 ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,             // 18
    padding: spacing.s4,               // 16
    borderWidth: 0.5,
    borderColor: colors.hairline,
    ...CARD_SHADOW,
    // RecordList 카드: row
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  // RecordDetail 카드: column (섹션 내부 수직 배치)
  cardColumn: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0,
  },

  // ── 카드 아이콘 ───────────────────────────────────────────────────────────
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent100,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── 상태 뱃지 ─────────────────────────────────────────────────────────────
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  badgeDone: {
    backgroundColor: '#D1FAE5',
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: typography.fz11,
    fontWeight: typography.fw6,
  },

  // ── 카드 텍스트 ───────────────────────────────────────────────────────────
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 0.5,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface2,
  },
  kindBadgeText: {
    fontSize: typography.fz11,
    color: colors.ink2,
    fontWeight: typography.fw5,
  },
  metaDate: {
    fontSize: typography.fz12,
    color: colors.muted,
  },
  cardPlace: {
    fontSize: typography.fz15,
    fontWeight: typography.fw6,
    color: colors.ink,
    lineHeight: 20,
  },
  cardDrug: {
    fontSize: typography.fz12,
    color: colors.muted,
  },

  // ── 빈 상태 ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: typography.fz14,
    color: colors.muted,
  },

  // ── 삭제 버튼 ─────────────────────────────────────────────────────────────
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s4,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  deleteBtnText: {
    fontSize: typography.fz13,
    fontWeight: typography.fw5,
    color: colors.ink2,
  },

  // ── 다운로드 버튼 ─────────────────────────────────────────────────────────
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // ── 발급 정보 그리드 ──────────────────────────────────────────────────────
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoCell: {
    width: "50%",
    paddingVertical: spacing.s3,
    paddingRight: spacing.s3,
  },
  infoCellLabel: {
    fontSize: typography.fz11,
    color: colors.muted,
  },
  infoCellValue: {
    fontSize: typography.fz14,
    fontWeight: typography.fw6,
    color: colors.ink,
  },

  // ── 디테일: 네비 바 ───────────────────────────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
    paddingTop: Platform.OS === "ios" ? 52 : 24,
    paddingBottom: spacing.s4,
    paddingHorizontal: spacing.s5,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    flexShrink: 0,
  },
  navTitle: {
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    flex: 1,
    color: colors.ink,
  },

  // ── 디테일: 섹션 ──────────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s3,
  },
  sectionTitle: {
    fontSize: typography.fz13,
    fontWeight: typography.fw6,
    color: colors.ink,
  },
  linkText: {
    fontSize: typography.fz12,
    color: colors.accent,
    fontWeight: typography.fw5,
  },

  // ── 디테일: 약품 행 ───────────────────────────────────────────────────────
  drugRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  drugInfo: {
    flex: 1,
    gap: 3,
  },
  drugName: {
    fontSize: typography.fz14,
    fontWeight: typography.fw6,
    color: colors.ink,
  },
  drugDetail: {
    fontSize: typography.fz12,
    color: colors.muted,
  },

  // ── 디테일: 이미지 플레이스홀더 ──────────────────────────────────────────
  imagePlaceholder: {
    height: 140,
    backgroundColor: colors.accent50,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s2,
  },
});

export default RecordListScreen;
