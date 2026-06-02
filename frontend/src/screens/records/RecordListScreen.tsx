import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ScreenLayout from "../../components/ScreenLayout";
import { colors, radii, spacing, typography } from "../../theme";
import IconCircle from "../../components/IconCircle";
import { recordsApi, extractApiError } from "../../api";
import type { RecordSummary } from "../../api";
import { RECORD_LABEL, FILTER_TO_TYPE, iconFor, formatDate, getRecordColor, s } from "./_recordsShared";
import EmptyState from "../../components/EmptyState";

function statusChip(status: string): { label: string; color: string; bg: string } {
  if (status === 'ocr_completed')
    return { label: '완료', color: colors.success, bg: colors.success50 };
  if (status === 'ocr_failed')
    return { label: '실패', color: colors.danger, bg: colors.danger50 };
  if (status === 'ocr_pending')
    return { label: '처리 중', color: colors.muted, bg: colors.surface2 };
  if (status === 'uploaded')
    return { label: '업로드됨', color: colors.accent700, bg: colors.accent50 };
  return { label: status, color: colors.muted, bg: colors.surface2 };
}

function cardTitle(r: RecordSummary): string {
  if (r.record_type === 'manual') return '직접 입력';
  return r.hospital_name ?? RECORD_LABEL[r.record_type];
}

function RecordRow({ r, onPress }: { r: RecordSummary; onPress: () => void }) {
  const chip = statusChip(r.status);
  return (
    <Card shadow noPadding onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s14, padding: spacing.s20 }}>
        <IconCircle size={44} icon={iconFor(r.record_type)} iconSize={18} color={getRecordColor(r.record_id)} backgroundColor={getRecordColor(r.record_id) + "22"} borderRadius={radii.sm} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s8, marginBottom: spacing.s4 }}>
            <View style={{ paddingHorizontal: spacing.s8, paddingVertical: spacing.s2, borderRadius: radii.pill, borderWidth: 0.5, borderColor: colors.hairline }}>
              <Text style={{ fontSize: typography.fz11, color: colors.ink2 }}>{RECORD_LABEL[r.record_type]}</Text>
            </View>
            <View style={{ paddingHorizontal: spacing.s8, paddingVertical: spacing.s2, borderRadius: radii.pill, backgroundColor: chip.bg }}>
              <Text style={{ fontSize: typography.fz11, color: chip.color, fontWeight: typography.fw6 }}>{chip.label}</Text>
            </View>
            <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{formatDate(r.uploaded_at)}</Text>
          </View>
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}>
            {cardTitle(r)}
          </Text>
          {r.medication_count != null ? (
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: spacing.s2 }}>약품 {r.medication_count}개</Text>
          ) : null}
        </View>
        <Icon name="chevron-right" size={16} color={colors.muted2} />
      </View>
    </Card>
  );
}

export function RecordListScreen({ navigation }: any) {
  const [filter, setFilter] = useState("전체");
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const tabs = ["전체", "처방전", "약봉투", "진료기록", "직접입력"];

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
        setRecords(res.items);
      } catch (e) {
        setError(extractApiError(e));
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

  const headerProps = {
    title: "진료기록",
    subtitle: "업로드한 의료 문서와 분석 결과를 확인할 수 있어요.",
    right: (
      <Button
        variant="primary"
        size="sm"
        leftIcon="camera"
        onPress={() => navigation.navigate("UploadModal")}
      >
        업로드
      </Button>
    ),
    headerExtra: (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", gap: spacing.s6 }}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} style={[s.chip, filter === t && s.chipActive]} onPress={() => setFilter(t)}>
            <Text style={[{ fontSize: typography.fz12 }, filter === t && { color: colors.accent700, fontWeight: typography.fw6 }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    ),
    refreshing,
    onRefresh: () => fetchRecords(true),
  } as const;

  if (loading) {
    return (
      <ScreenLayout {...headerProps} scrollable={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  if (error) {
    return (
      <ScreenLayout {...headerProps} scrollable={false}>
        <EmptyState
          icon="alert"
          title="목록을 불러오지 못했어요"
          message={error}
          action={{ label: '다시 시도', onPress: () => fetchRecords() }}
        />
      </ScreenLayout>
    );
  }

  if (records.length === 0) {
    return (
      <ScreenLayout {...headerProps} scrollable={false}>
        <EmptyState icon="doc" message="아직 업로드된 기록이 없어요." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      {...headerProps}
      scrollable
      scrollPadding={false}
      contentStyle={{ padding: spacing.s16, gap: spacing.s12 }}
    >
      {records.map((r) => (
        <RecordRow
          key={r.record_id}
          r={r}
          onPress={() => navigation.navigate("RecordDetail", { recordId: r.record_id })}
        />
      ))}
    </ScreenLayout>
  );
}

export default RecordListScreen;
