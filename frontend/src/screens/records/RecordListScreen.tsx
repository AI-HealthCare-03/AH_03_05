import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import ScreenLayout from "../../components/ScreenLayout";
import { colors, spacing, typography } from "../../theme";
import { recordsApi, extractApiError } from "../../api";
import type { RecordSummary } from "../../api";
import { RECORD_LABEL, FILTER_TO_TYPE, iconFor, formatDate, getRecordColor, s } from "./_recordsShared";

const devRecords: RecordSummary[] = [
  { record_id: 1, record_type: "prescription", status: "ocr_completed", uploaded_at: "2026-05-11T10:00:00" },
  { record_id: 2, record_type: "medicine_bag", status: "ocr_completed", uploaded_at: "2026-04-22T14:00:00" },
  { record_id: 3, record_type: "medical_record", status: "uploaded", uploaded_at: "2026-04-15T09:00:00" },
];

export function RecordListScreen({ navigation }: any) {
  const [filter, setFilter] = useState("전체");
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const tabs = ["전체", "처방전", "약봉투", "진료기록"];

  const fetchRecords = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const recordType = FILTER_TO_TYPE[filter];
        const res = await recordsApi.getRecords({
          ...(recordType !== undefined && { record_type: recordType }),
          size: 50,
        });
        if (res.items.length === 0 && __DEV__) {
          if (filter === '전체') {
            console.warn('[RecordListScreen] 전체 조회 결과 0건 — 백엔드 GET /records 필터 없음 버그 의심');
          }
          setRecords(devRecords);
        } else {
          setRecords(res.items);
        }
      } catch (e) {
        if (__DEV__) {
          setRecords(devRecords);
        } else {
          setError(extractApiError(e));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <ScreenLayout
      title="진료기록"
      subtitle="업로드한 의료 문서와 분석 결과를 확인할 수 있어요."
      right={
        <Button
          variant="primary"
          size="sm"
          leftIcon="camera"
          onPress={() => navigation.navigate("UploadModal")}
        >
          업로드
        </Button>
      }
      headerExtra={
        <View style={{ flexDirection: "row", gap: 6 }}>
          {tabs.map((t) => (
            <TouchableOpacity key={t} style={[s.chip, filter === t && s.chipActive]} onPress={() => setFilter(t)}>
              <Text style={[{ fontSize: typography.fz12 }, filter === t && { color: colors.accent700, fontWeight: typography.fw6 }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
      scrollable={!loading && !error}
      scrollPadding={false}
      contentStyle={!loading && !error ? { padding: spacing.s16, gap: spacing.s12 } : undefined}
      refreshing={refreshing}
      onRefresh={() => fetchRecords(true)}
    >
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.s20 }}>
          <Icon name="alert" size={32} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s12, textAlign: "center" }}>{error}</Text>
          <Button variant="primary" style={{ marginTop: spacing.s16 }} onPress={() => fetchRecords()}>
            다시 시도
          </Button>
        </View>
      ) : records.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Icon name="doc" size={40} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s12 }}>아직 업로드된 기록이 없어요.</Text>
        </View>
      ) : (
        records.map((r) => (
          <TouchableOpacity key={r.record_id} style={s.recordCard} onPress={() => navigation.navigate("RecordDetail", { recordId: r.record_id })}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: getRecordColor(r.record_id) + "22", alignItems: "center", justifyContent: "center" }}>
                <Icon name={iconFor(r.record_type)} size={18} color={getRecordColor(r.record_id)} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s8, marginBottom: spacing.s4 }}>
                  <View style={{ paddingHorizontal: spacing.s8, paddingVertical: 2, borderRadius: 999, borderWidth: 0.5, borderColor: colors.hairline }}>
                    <Text style={{ fontSize: typography.fz11, color: colors.ink2 }}>{RECORD_LABEL[r.record_type]}</Text>
                  </View>
                  <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{formatDate(r.uploaded_at)}</Text>
                </View>
                <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}>{RECORD_LABEL[r.record_type]}</Text>
                <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>{r.status.replace(/_/g, " ")}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={colors.muted2} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScreenLayout>
  );
}

export default RecordListScreen;
