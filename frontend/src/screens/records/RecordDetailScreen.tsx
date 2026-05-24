import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import ScreenLayout from "../../components/ScreenLayout";
import { colors, radii, spacing, typography } from "../../theme";
import { recordsApi, extractApiError } from "../../api";
import type { RecordDetail, MedicationItem, RecordGuideResponse } from "../../api";
import { RECORD_LABEL, formatDate, getRecordColor, s } from "./_recordsShared";

function mapApiError(err: any): string {
  const status = err?.response?.status;
  if (status === 403) return "접근 권한이 없습니다.";
  if (status === 404) return "기록을 찾을 수 없습니다.";
  if (!err?.response) return "네트워크 오류가 발생했습니다.";
  return extractApiError(err) || "오류가 발생했습니다.";
}

export function RecordDetailScreen({ navigation, route }: any) {
  const recordId: number | undefined = route?.params?.recordId;
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [guide, setGuide] = useState<RecordGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      setError("기록 ID가 없어요.");
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [rec, meds, gd] = await Promise.allSettled([
          recordsApi.getRecord(recordId),
          recordsApi.getRecordMedications(recordId),
          recordsApi.getRecordGuide(recordId),
        ]);

        if (rec.status === "fulfilled") {
          setRecord(rec.value);
        } else if (__DEV__) {
          setRecord({
            record_id: 10,
            record_type: "prescription",
            status: "ocr_completed",
            uploaded_at: "2026-05-11T10:00:00",
            ocr_confidence: 0.91,
          });
        } else {
          setError(mapApiError((rec as PromiseRejectedResult).reason));
        }

        // TODO: [BE 대기] GET /records/{record_id}/medications 미구현 — 구현 완료 후 __DEV__ 분기 제거
        if (meds.status === "fulfilled") {
          setMedications(meds.value.medications);
        } else if (__DEV__) {
          setMedications([
            { medication_id: 30, drug_name: "타이레놀정500mg", is_verified: true },
          ]);
        } else {
          console.error("[RecordDetail] medications 로드 실패:", (meds as PromiseRejectedResult).reason);
        }

        // TODO: [BE 대기] GET /records/{record_id}/guide 미구현 — 구현 완료 후 __DEV__ 분기 제거
        if (gd.status === "fulfilled") {
          setGuide(gd.value);
        } else if (__DEV__) {
          setGuide({ record_id: 10, guide_id: 50, status: "completed" });
        } else {
          console.error("[RecordDetail] guide 로드 실패:", (gd as PromiseRejectedResult).reason);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  const handleDelete = async () => {
    if (!recordId) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await recordsApi.deleteRecord(recordId);
      setDeleteModal(false);
      navigation.goBack();
    } catch (err: any) {
      console.error("[RecordDetail] 삭제 실패:", err);
      setDeleteError(mapApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  if (error || !record) {
    return (
      <ScreenLayout back onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.s20 }}>
          <Text style={{ fontSize: typography.fz14, color: colors.muted }}>{error || "기록을 불러올 수 없어요."}</Text>
        </View>
      </ScreenLayout>
    );
  }

  const typeLabel = RECORD_LABEL[record.record_type];
  const guideReady = guide?.status === "completed";

  return (
    <>
      <ScreenLayout
        title={`${typeLabel} · ${formatDate(record.uploaded_at ?? "")}`}
        back
        onBack={() => navigation.goBack()}
        right={
          <Button
            variant="primary"
            size="sm"
            leftIcon="wand"
            disabled={!guideReady}
            onPress={() =>
              guide?.guide_id
                ? navigation.getParent()?.navigate("HomeTab", { screen: "GuideResult", params: { guideId: guide.guide_id } })
                : navigation.getParent()?.navigate("HomeTab", { screen: "GuideLoading", params: { recordId } })
            }
          >
            가이드
          </Button>
        }
        scrollable
      >
        {/* 기본 정보 */}
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", gap: spacing.s16, flexWrap: "wrap" }}>
            {[
              ["종류", typeLabel],
              ["업로드", formatDate(record.uploaded_at ?? "")],
              ["상태", record.status.replace(/_/g, " ")],
              ...(record.ocr_confidence != null ? [["OCR 정확도", `${Math.round(record.ocr_confidence * 100)}%`]] : []),
            ].map(([k, v]) => (
              <View key={k}>
                <Text style={{ fontSize: typography.fz11, color: colors.muted }}>{k}</Text>
                <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6, marginTop: 2 }}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* 복약 가이드 */}
        {guide && (
          <Card style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s8 }}>
                <Icon name="wand" size={14} color={colors.accent700} />
                <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>복약 가이드</Text>
              </View>
              {guideReady ? (
                <Badge variant="success" size="sm">완료</Badge>
              ) : (
                <Badge variant="default" size="sm">
                  {guide.status === "pending" ? "대기 중" : guide.status === "running" ? "생성 중" : guide.status}
                </Badge>
              )}
            </View>
            {guide.summary ? (
              <Text style={{ fontSize: typography.fz13, color: colors.ink2, marginTop: spacing.s8, lineHeight: 20 }}>{guide.summary}</Text>
            ) : null}
          </Card>
        )}

        {/* 처방 약품 */}
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.s12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>처방 약품 ({medications.length}종)</Text>
            </View>
          </View>
          {medications.length === 0 ? (
            <Text style={{ fontSize: typography.fz13, color: colors.muted, textAlign: "center", paddingVertical: spacing.s12 }}>약품 정보를 불러오는 중이에요.</Text>
          ) : (
            medications.map((med, i) => (
              <View key={med.medication_id} style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
                <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: getRecordColor(recordId ?? 0) }} />
                <View style={{ flex: 1, marginLeft: spacing.s12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{med.drug_name}</Text>
                    {med.is_verified && <Badge variant="success" size="sm">확인됨</Badge>}
                  </View>
                  {med.dosage || med.frequency ? (
                    <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{[med.frequency, med.dosage].filter(Boolean).join(" · ")}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("DrugDosage")}>
                  <Text style={{ fontSize: typography.fz12, color: colors.accent }}>복용법 수정</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* 원본 이미지 */}
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>원본 이미지</Text>
          </View>
          <View style={{ height: 140, backgroundColor: colors.accent50, borderRadius: radii.md, alignItems: "center", justifyContent: "center" }}>
            <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
          </View>
          <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 10 }}>
            {typeLabel} · {formatDate(record.uploaded_at ?? "")}
          </Text>
        </Card>

        <TouchableOpacity
          style={{ borderWidth: 1, borderColor: colors.danger, borderRadius: radii.pill, height: 50, alignItems: "center", justifyContent: "center" }}
          onPress={() => setDeleteModal(true)}
        >
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.danger }}>기록 삭제</Text>
        </TouchableOpacity>
      </ScreenLayout>

      {/* 삭제 확인 모달 */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.s24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s24, width: "100%", maxWidth: 360 }}>
            <Text style={{ fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink, marginBottom: spacing.s8 }}>기록 삭제</Text>
            <Text style={{ fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s20, lineHeight: 22 }}>
              이 기록과 연결된 약품 정보, 가이드가 모두 삭제돼요. 삭제 후에는 복구가 불가능해요.
            </Text>
            {deleteError ? (
              <Text style={{ fontSize: typography.fz13, color: colors.danger, marginBottom: spacing.s12 }}>{deleteError}</Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: spacing.s12, justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm" onPress={() => { setDeleteModal(false); setDeleteError(""); }}>취소</Button>
              <Button variant="danger" size="sm" onPress={handleDelete} disabled={deleting}>
                {deleting ? "삭제 중..." : "삭제"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default RecordDetailScreen;
