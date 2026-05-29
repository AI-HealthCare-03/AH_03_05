import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ScreenLayout from "../../components/ScreenLayout";
import { colors, spacing, typography } from "../../theme";
import { recordsApi, extractApiError } from "../../api";
import type { RecordSummary } from "../../api";
import { RECORD_LABEL, FILTER_TO_TYPE, iconFor, formatDate, getRecordColor, s } from "./_recordsShared";


function RecordRow({ r, onPress }: { r: RecordSummary; onPress: () => void }) {
  return (
    <Card shadow noPadding onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: spacing.s20 }}>
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
          <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw6, color: colors.ink }}>
            {r.hospital_name ?? "병원 정보 없음"}
          </Text>
          {r.medication_count != null ? (
            <Text style={{ fontSize: typography.fz12, color: colors.muted, marginTop: 2 }}>약품 {r.medication_count}개</Text>
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
      <View style={{ flexDirection: "row", gap: 6 }}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} style={[s.chip, filter === t && s.chipActive]} onPress={() => setFilter(t)}>
            <Text style={[{ fontSize: typography.fz12 }, filter === t && { color: colors.accent700, fontWeight: typography.fw6 }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.s20 }}>
          <Icon name="alert" size={32} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s12, textAlign: "center" }}>{error}</Text>
          <Button variant="primary" style={{ marginTop: spacing.s16 }} onPress={() => fetchRecords()}>
            다시 시도
          </Button>
        </View>
      </ScreenLayout>
    );
  }

  if (records.length === 0) {
    return (
      <ScreenLayout {...headerProps} scrollable={false}>
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Icon name="doc" size={40} color={colors.muted2} />
          <Text style={{ fontSize: typography.fz14, color: colors.muted, marginTop: spacing.s12 }}>아직 업로드된 기록이 없어요.</Text>
        </View>
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
