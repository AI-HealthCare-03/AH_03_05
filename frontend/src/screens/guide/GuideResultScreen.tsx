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
import EmptyState from "../../components/EmptyState";

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function formatGuideDate(timestamp: string): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day} 생성`;
}

// ─── 서브컴포넌트 ──────────────────────────────────────────────────────────────

type GuideItem = GuideResponse["guide_items"][number];

function GuideItemCard({ item }: { item: GuideItem }) {
  return (
    <Card shadow style={{ marginBottom: spacing.s14 }}>
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


// ─── GuideResultScreen ─────────────────────────────────────────────────────────

export function GuideResultScreen({ navigation, route }: any) {
  const [tab, setTab] = useState<"med" | "life">("med");
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [commentVisible, setCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
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
      subtitle={guide?.data_source.timestamp ? formatGuideDate(guide.data_source.timestamp) : undefined}
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
            <View style={s.errorBanner}>
              <Icon name="alert" size={14} color={colors.danger} />
              <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>{guideError}</Text>
            </View>
          ) : apiMedItems.length > 0 ? (
            apiMedItems.map((item) => <GuideItemCard key={item.sort_order} item={item} />)
          ) : guide?.medication_guide ? (
            <Card shadow style={{ marginBottom: spacing.s14 }}>
              <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 }}>{guide.medication_guide}</Text>
            </Card>
          ) : (
            <EmptyState icon="doc" message="가이드 정보를 불러오지 못했습니다." />
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
            <View style={s.errorBanner}>
              <Icon name="alert" size={14} color={colors.danger} />
              <Text style={{ fontSize: typography.fz13, color: colors.danger, flex: 1 }}>{guideError}</Text>
            </View>
          ) : apiLifeItems.length > 0 ? (
            apiLifeItems.map((item) => <GuideItemCard key={item.sort_order} item={item} />)
          ) : guide?.lifestyle_guide ? (
            <Card shadow style={{ marginBottom: spacing.s14 }}>
              <Text style={{ fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 }}>{guide.lifestyle_guide}</Text>
            </Card>
          ) : (
            <EmptyState icon="doc" message="가이드 정보를 불러오지 못했습니다." />
          )}
        </>
      )}

      {/* 응급 증상 안내 (REQ-SAFE-001 필수) */}
      <View style={s.emergencyBanner}>
        <Text style={s.emergencyTitle}>⚠️ 즉시 응급실 방문이 필요한 증상</Text>
        <Text style={s.emergencyBody}>심한 흉통, 호흡곤란, 검은 변, 의식 변화, 심한 출혈이 발생하면 즉시 119에 연락하거나 응급실로 가세요.</Text>
      </View>

      {/* 피드백 (REQ-FB-001) — guideId 없을 때 숨김 */}
      {guideId != null && <Card shadow style={{ alignItems: "center", gap: spacing.s10 }}>
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
            <Text style={{ fontSize: typography.fz18 }}>👍</Text>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: feedback === "good" ? colors.accent700 : colors.ink2 }}>도움됨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!!feedback}
            style={[s.feedbackBtn, { borderColor: feedback === "bad" ? colors.danger : colors.hairlineStrong, backgroundColor: feedback === "bad" ? colors.danger50 : "transparent", opacity: feedback && feedback !== "bad" ? 0.4 : 1 }]}
            onPress={() => { if (!feedback) setCommentVisible(true); }}
          >
            <Text style={{ fontSize: typography.fz18 }}>👎</Text>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: feedback === "bad" ? colors.danger : colors.ink2 }}>별로</Text>
          </TouchableOpacity>
        </View>
      </Card>}

      {/* 👎 코멘트 모달 */}
      <Modal transparent visible={commentVisible} animationType="fade" onRequestClose={() => { setCommentVisible(false); setCommentText(''); }}>
        <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: "center", alignItems: "center", padding: spacing.s24 }}>
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
  // 에러 배너
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.s8, backgroundColor: colors.danger50, borderRadius: radii.md, padding: spacing.s12, marginBottom: spacing.s14, borderWidth: 1, borderColor: colors.danger },

  // 안전 배너
  safetyBanner: { backgroundColor: colors.accent50, borderRadius: radii.md, padding: spacing.s12, flexDirection: "row", alignItems: "flex-start", gap: spacing.s10, marginBottom: spacing.s14, borderWidth: 1, borderColor: colors.accent100 },
  safetyText: { fontSize: typography.fz13, color: colors.accent700, flex: 1, lineHeight: 20 },

  // 탭 바
  tabBar: { flexDirection: "row", alignSelf: "flex-start", backgroundColor: colors.surface2, borderRadius: radii.md, padding: spacing.s4, gap: spacing.s4, marginBottom: spacing.s14, borderWidth: 0.5, borderColor: colors.hairline },
  tabBtn: { paddingVertical: spacing.s6, paddingHorizontal: spacing.s12, alignItems: "center", justifyContent: "center", borderRadius: radii.icon },
  tabBtnActive: { backgroundColor: colors.accent50, borderWidth: 1, borderColor: colors.accent100 },
  tabText: { fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink2 },
  tabTextActive: { color: colors.accent700 },

  // 카드 헤더
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.s6, marginBottom: spacing.s12 },
  cardHeaderText: { fontSize: typography.fz13, fontWeight: typography.fw6 },

  // 응급 배너
  emergencyBanner: { backgroundColor: colors.danger50, borderRadius: radii.md, padding: spacing.s12, borderWidth: 1, borderColor: colors.danger, marginTop: spacing.s8, marginBottom: spacing.s14 },
  emergencyTitle: { fontSize: typography.fz13, fontWeight: typography.fw7, color: colors.danger, marginBottom: spacing.s6 },
  emergencyBody: { fontSize: typography.fz13, color: colors.ink2, lineHeight: 20 },

  // 피드백 버튼
  feedbackBtn: { flexDirection: "row", alignItems: "center", gap: spacing.s6, paddingHorizontal: spacing.s20, paddingVertical: spacing.s10, borderRadius: radii.pill, borderWidth: 1 },
});
