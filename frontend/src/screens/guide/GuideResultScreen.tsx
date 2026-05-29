import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, TextInput } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";
import { useApp } from "../../context/AppContext";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ScreenLayout from "../../components/ScreenLayout";
import { guidesApi, feedbacksApi, extractApiError } from "../../api";
import type { GuideResponse } from "../../api";

// ─── 모듈 레벨 상수 ────────────────────────────────────────────────────────────

const SCHEDULE = [
  { time: "08:30", label: "아침 식후 30분", drug: "암로디핀정 5mg", color: colors.scheduleMorning },
  { time: "12:30", label: "점심 식후 30분", drug: "메트포르민 500mg", color: colors.scheduleLunch },
  { time: "19:00", label: "저녁 식후 30분", drug: "메트포르민 500mg, 로수바스타틴 10mg", color: colors.scheduleEvening },
];

const WARNINGS = [
  { title: "자몽 및 자몽주스", body: "암로디핀의 체내 농도를 높여 혈압이 과도하게 떨어질 수 있습니다." },
  { title: "고지방 식사", body: "스타틴 계열의 흡수를 방해하고 콜레스테롤 수치를 악화시킵니다." },
  { title: "과도한 음주", body: "간 손상 위험을 높이고 혈압 조절을 방해할 수 있습니다." },
];

const MED_STEPS = ["복용 시간을 매일 같은 시간으로 지켜주세요.", "두통, 발목 부종이 생기면 의사에게 알려주세요.", "다른 약과 함께 먹기 전에 약사와 상의하세요."];

const LIFE_ITEMS = [
  { id: "salt", title: "나트륨 2,000mg 이하 저염식 실천하기", sub: "국물은 남기고, 소금 대신 레몬이나 식초로 간을 맞추세요." },
  { id: "walk", title: "주 5회, 30분 이상 빠르게 걷기", sub: "숨이 약간 찰 정도의 강도로 유산소 운동을 해주세요." },
  { id: "stroll", title: "식후 1시간 뒤 가벼운 산책하기", sub: "당뇨 관리를 위해 식사 후 급격한 혈당 상승을 방지합니다." },
];

// ─── 서브컴포넌트 ──────────────────────────────────────────────────────────────

type GuideItem = GuideResponse["guide_items"][number];

function GuideItemCard({ item }: { item: GuideItem }) {
  return (
    <Card shadow style={{ marginBottom: 14 }}>
      {item.title ? (
        <View style={s.cardHeader}>
          <Icon name="link" size={14} color={colors.ink2} />
          <Text style={s.cardHeaderText}>{item.title}</Text>
        </View>
      ) : null}
      <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 }}>{item.content}</Text>
    </Card>
  );
}

function ScheduleRow({ sc, hasBorder }: { sc: (typeof SCHEDULE)[number]; hasBorder: boolean }) {
  return (
    <View style={[s.scheduleRow, hasBorder && s.scheduleRowBorder]}>
      <Text style={[s.scheduleTime, { color: sc.color }]}>{sc.time}</Text>
      <Text style={s.scheduleLabel}>{sc.label}</Text>
      <Text style={s.scheduleDrug} numberOfLines={2}>
        {sc.drug}
      </Text>
    </View>
  );
}

function WarningItem({ w, hasMargin }: { w: (typeof WARNINGS)[number]; hasMargin: boolean }) {
  return (
    <View style={[s.warnRow, hasMargin && { marginBottom: spacing.s12 }]}>
      <View style={s.warnDot}>
        <Icon name="alert" size={11} color={colors.danger} />
      </View>
      <Text style={{ fontSize: typography.fz13, flex: 1, color: colors.ink2 }}>
        <Text style={{ color: colors.danger, fontWeight: typography.fw6 }}>{w.title}: </Text>
        {w.body}
      </Text>
    </View>
  );
}

function MedStepItem({ step, index, hasBorder }: { step: string; index: number; hasBorder: boolean }) {
  return (
    <View style={[s.scheduleRow, hasBorder && s.scheduleRowBorder]}>
      <View style={s.stepNum}>
        <Text style={s.stepNumText}>{index + 1}</Text>
      </View>
      <Text style={{ fontSize: typography.fz13, flex: 1, color: colors.ink }}>{step}</Text>
    </View>
  );
}

function LifeCheckItem({ item, checked, onPress }: { item: (typeof LIFE_ITEMS)[number]; checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.checkRow} onPress={onPress}>
      <View
        style={[
          s.checkBox,
          {
            borderColor: checked ? colors.accent : colors.hairlineStrong,
            backgroundColor: checked ? colors.accent : "transparent",
          },
        ]}
      >
        {checked && <Icon name="check" size={12} color={colors.white} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.checkTitle}>{item.title}</Text>
        <Text style={s.checkSub}>{item.sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── GuideResultScreen ─────────────────────────────────────────────────────────

export function GuideResultScreen({ navigation, route }: any) {
  const [tab, setTab] = useState<"med" | "life">("med");
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [commentVisible, setCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const { flash } = useApp();

  const guideId: number | undefined = route?.params?.guideId;
  const [guide, setGuide] = useState<GuideResponse | null>(null);
  const [guideLoading, setGuideLoading] = useState(!!guideId);
  const [guideError, setGuideError] = useState('');

  useEffect(() => {
    if (!guideId) return;
    setGuideLoading(true);
    setGuideError('');
    guidesApi
      .getGuide(guideId)
      .then(setGuide)
      .catch(e => setGuideError(extractApiError(e)))
      .finally(() => setGuideLoading(false));
  }, [guideId]);

  const apiMedItems = guide?.guide_items.filter((it) => it.item_type === "medication") ?? [];
  const apiLifeItems = guide?.guide_items.filter((it) => it.item_type === "lifestyle") ?? [];

  return (
    <ScreenLayout
      title="복약 · 생활습관 가이드"
      subtitle="2026.05.01 생성 · 고혈압·당뇨 기준"
      right={
        <Button variant="ghost" size="sm" leftIcon="chat" onPress={() => navigation.getParent()?.navigate("ChatTab", { screen: "ChatList" })}>
          건강상담에 물어보기
        </Button>
      }
      scrollable
    >
      {/* 상단 의료 안전 고지 (REQ-SAFE-001 필수) */}
      <View style={s.safetyBanner}>
        <Icon name="info" size={16} color={colors.accent700} />
        <Text style={s.safetyText}>본 안내는 참고용이며 의료인의 진단·처방·복약지도를 대체하지 않습니다. 복약 변경 전 반드시 담당 의사·약사와 상담하세요.</Text>
      </View>

      {/* 탭 바 */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, tab === "med" && s.tabBtnActive]} onPress={() => setTab("med")}>
          <Text style={[s.tabText, tab === "med" && s.tabTextActive]}>💊 복약 안내</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === "life" && s.tabBtnActive]} onPress={() => setTab("life")}>
          <Text style={[s.tabText, tab === "life" && s.tabTextActive]}>🚶 생활습관</Text>
        </TouchableOpacity>
      </View>

      {/* ── 복약 탭 ── */}
      {tab === "med" && (
        <>
          {guideLoading ? (
            <View style={{ alignItems: "center", paddingVertical: spacing.s24 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : guideError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s8, backgroundColor: colors.danger50, borderRadius: radii.md, padding: spacing.s12, marginBottom: 14, borderWidth: 1, borderColor: colors.danger }}>
              <Icon name="alert" size={14} color={colors.danger} />
              <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>{guideError}</Text>
            </View>
          ) : apiMedItems.length > 0 ? (
            apiMedItems.map((item, i) => <GuideItemCard key={i} item={item} />)
          ) : (
            <>
              <Card shadow style={{ marginBottom: 14 }}>
                <View style={s.cardHeader}>
                  <Icon name="clock" size={14} color={colors.ink2} />
                  <Text style={s.cardHeaderText}>추천 복약 시간표</Text>
                </View>
                {SCHEDULE.map((sc, i) => (
                  <ScheduleRow key={i} sc={sc} hasBorder={i > 0} />
                ))}
              </Card>

              <Card shadow style={{ marginBottom: 14 }}>
                <View style={s.cardHeader}>
                  <Icon name="ban" size={14} color={colors.danger} />
                  <Text style={s.cardHeaderText}>주의/금기 식품</Text>
                </View>
                {WARNINGS.map((w, i) => (
                  <WarningItem key={i} w={w} hasMargin={i < WARNINGS.length - 1} />
                ))}
              </Card>

              <Card shadow>
                <View style={s.cardHeader}>
                  <Icon name="link" size={14} color={colors.ink2} />
                  <Text style={s.cardHeaderText}>상세 복약 안내</Text>
                </View>
                {MED_STEPS.map((st, i) => (
                  <MedStepItem key={i} step={st} index={i} hasBorder={i > 0} />
                ))}
              </Card>
            </>
          )}
        </>
      )}

      {/* ── 생활습관 탭 ── */}
      {tab === "life" && (
        <>
          {guideLoading ? (
            <View style={{ alignItems: "center", paddingVertical: spacing.s24 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : guideError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s8, backgroundColor: colors.danger50, borderRadius: radii.md, padding: spacing.s12, marginBottom: 14, borderWidth: 1, borderColor: colors.danger }}>
              <Icon name="alert" size={14} color={colors.danger} />
              <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>{guideError}</Text>
            </View>
          ) : apiLifeItems.length > 0 ? (
            apiLifeItems.map((item, i) => <GuideItemCard key={i} item={item} />)
          ) : (
            <>
              <Card shadow style={{ marginBottom: 14 }}>
                <View style={s.cardHeader}>
                  <Icon name="link" size={14} color={colors.ink2} />
                  <Text style={s.cardHeaderText}>고혈압·당뇨 관리 실천 체크리스트</Text>
                </View>
                {LIFE_ITEMS.map((it) => (
                  <LifeCheckItem key={it.id} item={it} checked={!!checks[it.id]} onPress={() => setChecks((c) => ({ ...c, [it.id]: !c[it.id] }))} />
                ))}
              </Card>

              <Card shadow style={{ backgroundColor: colors.accent50, borderColor: colors.accent100 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Icon name="link" size={14} color={colors.accent700} />
                  <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.accent700 }}>출처: 대한고혈압학회 2023 / 대한당뇨병학회</Text>
                </View>
              </Card>
            </>
          )}
        </>
      )}

      {/* 응급 증상 안내 (REQ-SAFE-001 필수) */}
      <View style={s.emergencyBanner}>
        <Text style={s.emergencyTitle}>⚠️ 즉시 응급실 방문이 필요한 증상</Text>
        <Text style={s.emergencyBody}>심한 흉통, 호흡곤란, 검은 변, 의식 변화, 심한 출혈이 발생하면 즉시 119에 연락하거나 응급실로 가세요.</Text>
      </View>

      {/* 피드백 (REQ-FB-001) — guideId 없을 때 숨김 */}
      {guideId != null && <Card shadow style={{ alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2 }}>이 가이드가 도움이 됐나요?</Text>
        <View style={{ flexDirection: "row", gap: spacing.s12 }}>
          <TouchableOpacity
            disabled={!!feedback}
            style={[s.feedbackBtn, { borderColor: feedback === "good" ? colors.accent : colors.hairlineStrong, backgroundColor: feedback === "good" ? colors.accent50 : "transparent", opacity: feedback && feedback !== "good" ? 0.4 : 1 }]}
            onPress={async () => {
              if (feedback) return;
              setFeedback("good");
              try {
                await feedbacksApi.createFeedback({ guide_id: guideId, rating: 4 });
                flash("감사합니다. 의견이 등록되었습니다");
              } catch (e) {
                flash(extractApiError(e));
                setFeedback(null);
              }
            }}
          >
            <Text style={{ fontSize: 18 }}>👍</Text>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: feedback === "good" ? colors.accent700 : colors.ink2 }}>도움됨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!!feedback}
            style={[s.feedbackBtn, { borderColor: feedback === "bad" ? colors.danger : colors.hairlineStrong, backgroundColor: feedback === "bad" ? colors.danger50 : "transparent", opacity: feedback && feedback !== "bad" ? 0.4 : 1 }]}
            onPress={() => { if (!feedback) setCommentVisible(true); }}
          >
            <Text style={{ fontSize: 18 }}>👎</Text>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: feedback === "bad" ? colors.danger : colors.ink2 }}>별로</Text>
          </TouchableOpacity>
        </View>
      </Card>}

      {/* 👎 코멘트 모달 */}
      <Modal transparent visible={commentVisible} animationType="fade" onRequestClose={() => { setCommentVisible(false); setCommentText(''); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: spacing.s24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s20, width: "100%", maxWidth: 400, gap: spacing.s12 }}>
            <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink }}>아쉬웠던 점을 알려주세요</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, padding: spacing.s12, paddingTop: spacing.s8, fontSize: typography.fz14, color: colors.ink, height: 80, textAlignVertical: "top" }}
              multiline
              placeholder="어떤 점이 아쉬웠나요? (선택)"
              placeholderTextColor={colors.muted2}
              value={commentText}
              onChangeText={setCommentText}
            />
            <View style={{ flexDirection: "row", gap: spacing.s8, justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm" onPress={() => { setCommentVisible(false); setCommentText(''); }}>취소</Button>
              <Button variant="primary" size="sm" onPress={async () => {
                setCommentVisible(false);
                setCommentText('');
                setFeedback("bad");
                try {
                  await feedbacksApi.createFeedback({ guide_id: guideId, rating: 2, comment: commentText || undefined });
                  flash("감사합니다. 의견이 등록되었습니다");
                } catch (e) {
                  flash(extractApiError(e));
                  setFeedback(null);
                }
              }}>등록</Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

export default GuideResultScreen;

// ─── StyleSheet ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // 안전 배너
  safetyBanner: { backgroundColor: colors.accent50, borderRadius: radii.md, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14, borderWidth: 1, borderColor: colors.accent100 },
  safetyText: { fontSize: typography.fz13, color: colors.accent700, flex: 1, lineHeight: 20 },

  // 탭 바
  tabBar: { flexDirection: "row", alignSelf: "flex-start", backgroundColor: colors.surface2, borderRadius: radii.md, padding: spacing.s4, gap: spacing.s4, marginBottom: 14, borderWidth: 0.5, borderColor: colors.hairline },
  tabBtn: { paddingVertical: 5, paddingHorizontal: spacing.s12, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  tabBtnActive: { backgroundColor: colors.accent50, borderWidth: 1, borderColor: colors.accent100 },
  tabText: { fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink2 },
  tabTextActive: { color: colors.accent700 },

  // 카드 헤더
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.s12 },
  cardHeaderText: { fontSize: typography.fz13, fontWeight: typography.fw6 },

  // 복약 시간표 행
  scheduleRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.s12 },
  scheduleRowBorder: { borderTopWidth: 0.5, borderTopColor: colors.hairline },
  scheduleTime: { fontSize: typography.fz15, fontWeight: typography.fw7, width: 52 },
  scheduleLabel: { fontSize: typography.fz13, fontWeight: typography.fw6, flex: 1 },
  scheduleDrug: { fontSize: typography.fz11, color: colors.muted, flex: 1, textAlign: "right" },

  // 번호 단계
  stepNum: { width: 22, height: 22, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: "center", justifyContent: "center", marginRight: spacing.s12 },
  stepNumText: { fontSize: typography.fz11, fontWeight: typography.fw7, color: colors.accent700 },

  // 경고 항목
  warnRow: { flexDirection: "row", gap: spacing.s12 },
  warnDot: { width: 22, height: 22, borderRadius: radii.pill, backgroundColor: colors.danger50, alignItems: "center", justifyContent: "center" },

  // 체크리스트
  checkRow: { flexDirection: "row", gap: spacing.s12, alignItems: "flex-start", paddingVertical: 10 },
  checkBox: { width: 22, height: 22, borderRadius: radii.checkbox, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkTitle: { fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink },
  checkSub: { fontSize: typography.fz12, color: colors.muted, marginTop: 2 },

  // 응급 배너
  emergencyBanner: { backgroundColor: colors.danger50, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.danger, marginTop: spacing.s8, marginBottom: 14 },
  emergencyTitle: { fontSize: typography.fz13, fontWeight: typography.fw7, color: colors.danger, marginBottom: 6 },
  emergencyBody: { fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 },

  // 피드백 버튼
  feedbackBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.s20, paddingVertical: spacing.s10, borderRadius: radii.pill, borderWidth: 1 },
});
