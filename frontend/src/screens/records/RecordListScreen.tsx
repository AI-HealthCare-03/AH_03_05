// records/RecordListScreen.tsx + RecordDetailScreen.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useApp } from "../../context/AppContext";
import Icon from "../../components/Icon";
import { colors, radii, spacing } from "../../theme";

const iconFor = (kind: string) => (kind === "처방전" ? "doc" : kind === "약봉투" ? "pill" : "list");

export function RecordListScreen({ navigation }: any) {
  const { records, setPendingUpload } = useApp();
  const [filter, setFilter] = useState("전체");
  const tabs = ["전체", "처방전", "약봉투", "진료기록"];
  const filtered = filter === "전체" ? records : records.filter((r) => r.kind === filter);

  return (
    <View style={s.root}>
      <View style={[s.topBar, { flexDirection: "column", alignItems: "flex-start", gap: 10 }]}>
        <Text style={s.screenTitle}>진료기록</Text>
        <Text style={s.screenSub}>업로드한 의료 문서와 분석 결과를 확인할 수 있어요.</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {tabs.map((t) => (
              <TouchableOpacity key={t} style={[s.chip, filter === t && s.chipActive]} onPress={() => setFilter(t)}>
                <Text style={[{ fontSize: 12 }, filter === t && { color: colors.accent700, fontWeight: "600" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => {
              setPendingUpload(true);
              navigation.navigate("HomeTab", { screen: "Home" });
            }}
          >
            <Icon name="camera" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 }}>업로드</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.s4, gap: 12 }}>
        {filtered.map((r) => (
          <TouchableOpacity key={r.id} style={s.card} onPress={() => navigation.navigate("RecordDetail", { recordId: r.id })}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={s.recordIcon}>
                <Icon name={iconFor(r.kind)} size={18} color={colors.accent700} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <View style={s.kindBadge}>
                    <Text style={{ fontSize: 11, color: colors.ink2 }}>{r.kind}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{r.date}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.ink }}>{r.place}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{r.drugCount > 0 ? `약품 ${r.drugCount}개` : "검진"}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={colors.muted2} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export function RecordDetailScreen({ navigation, route }: any) {
  const { records, setPendingUpload } = useApp();
  const record = records.find((r) => r.id === route?.params?.recordId) || records[0];
  const drugSeed = [
    { name: "암로디핀정 5mg", maker: "한미약품", freq: "1일 1회", time: "아침 식후 30분", days: "14일", color: "#0EA5E9" },
    { name: "로수바스타틴 10mg", maker: "유한양행", freq: "1일 1회", time: "저녁 식후", days: "30일", color: "#8B5CF6" },
    { name: "메트포르민 500mg", maker: "A제약", freq: "1일 2회", time: "점심·저녁 식후", days: "30일", color: "#10B981" },
  ];

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", flex: 1, marginLeft: 8 }} numberOfLines={1}>
          {record.place}
        </Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate("GuideResult")}>
          <Icon name="wand" size={13} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 }}>가이드</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.s4 }}>
        {/* Drug list */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="link" size={14} color={colors.ink2} />
              <Text style={{ fontSize: 13, fontWeight: "600" }}>처방 약품 ({drugSeed.length}종)</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted }}>총 처방일수 30일</Text>
          </View>
          {drugSeed.map((d, i) => (
            <View key={i} style={[s.drugRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
              <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: d.color }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>{d.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>({d.maker})</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {d.freq} · {d.time} · {d.days}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("DrugDosage")}>
                <Text style={{ fontSize: 12, color: colors.accent }}>복용법</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Doctor note */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8 }}>의사 메모</Text>
          <Text style={{ fontSize: 14, color: colors.ink2 }}>{record.note}</Text>
        </View>

        {/* Image placeholder */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600" }}>원본 이미지</Text>
            <Text style={{ fontSize: 12, color: colors.accent }}>다운로드</Text>
          </View>
          <View style={{ height: 140, backgroundColor: colors.accent50, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <Icon name="doc" size={72} color="rgba(8,145,178,0.3)" />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>처방전.jpg</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>1.8MB · 업로드 {record.date}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topBar: { paddingHorizontal: spacing.s4, paddingTop: 52, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.hairline, flexDirection: "row", alignItems: "center" },
  screenTitle: { fontSize: 24, fontWeight: "700", color: colors.ink },
  screenSub: { fontSize: 13, color: colors.muted },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.s5, borderWidth: 0.5, borderColor: colors.hairline, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  btnPrimary: { flexDirection: "row", backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  recordIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent50, alignItems: "center", justifyContent: "center" },
  kindBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, borderWidth: 0.5, borderColor: colors.hairline },
  drugRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
});

export default RecordListScreen;
