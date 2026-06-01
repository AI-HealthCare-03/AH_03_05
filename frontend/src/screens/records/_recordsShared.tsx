import { StyleSheet } from "react-native";
import { colors, radii, spacing } from "../../theme";
import type { RecordType } from "../../api";

const RECORD_COLORS = [colors.scheduleMorning, colors.scheduleLunch, colors.scheduleEvening, colors.accent, colors.success, colors.warning];

export function getRecordColor(recordId: number): string {
  return RECORD_COLORS[recordId % RECORD_COLORS.length];
}

export const RECORD_LABEL: Record<RecordType, string> = {
  prescription: "처방전",
  medicine_bag: "약봉투",
  medical_record: "진료기록",
  manual: "직접입력",
};

export const FILTER_TO_TYPE: Record<string, RecordType | undefined> = {
  전체: undefined,
  처방전: "prescription",
  약봉투: "medicine_bag",
  진료기록: "medical_record",
  직접입력: "manual",
};

export const iconFor = (type: RecordType) =>
  type === "prescription" ? "doc" :
  type === "medicine_bag" ? "pill" :
  type === "manual" ? "keyboard" :
  "list";

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export const s = StyleSheet.create({
  chip: { paddingHorizontal: spacing.s12, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  drugRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
});
