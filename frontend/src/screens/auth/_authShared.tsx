import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParams } from "../../navigation/types";
import Icon from "../../components/Icon";
import MediPTLogo from "../../components/MediPTLogo";
import { colors, radii, spacing, typography } from "../../theme";

export type AuthNavProp = NativeStackNavigationProp<AuthStackParams>;

// ─── BrandPanel (desktop left panel) ─────────────────────────────────────────

export function BrandPanel({ tagline, desc, features }: { tagline: React.ReactNode; desc: string; features: { icon: string; title: string; sub: string }[] }) {
  return (
    <LinearGradient colors={[colors.accentLight, colors.accent700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bp.panel}>
      {/* 브랜드 로고 — 패널 최상단 고정 */}
      <MediPTLogo width={130} />

      {/* 메인 컨텐츠 — 나머지 공간에서 수직 중앙 */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={bp.tagline}>{tagline}</Text>
        <Text style={bp.desc}>{desc}</Text>
        {features.map((f) => (
          <View key={f.title} style={bp.feat}>
            <View style={bp.featIcon}>
              <Icon name={f.icon} size={16} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={bp.featTitle}>{f.title}</Text>
              <Text style={bp.featSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const bp = StyleSheet.create({
  panel: {
    flex: 1,
    padding: spacing.s40,
  },
  tagline: { fontSize: typography.fz26, fontWeight: typography.fw7, color: colors.white, lineHeight: 36, marginBottom: spacing.s14 },
  desc: { fontSize: typography.fz14, color: colors.onAccent80, lineHeight: 22, marginBottom: spacing.s24 },
  feat: { flexDirection: "row", alignItems: "flex-start", gap: spacing.s12, marginBottom: spacing.s16 },
  featIcon: { width: 34, height: 34, borderRadius: radii.icon, backgroundColor: colors.onAccent20, alignItems: "center", justifyContent: "center" },
  featTitle: { fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.white, marginBottom: spacing.s2 },
  featSub: { fontSize: typography.fz12, color: colors.onAccent75 },
});

// ─── Shared styles ────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  authContainer: {
    flexGrow: 1,
    padding: spacing.s24,
    backgroundColor: colors.canvas,
  },
  brandRow: {
    marginBottom: spacing.s24,
  },
  authTitle: { fontSize: 24, fontWeight: typography.fw7, color: colors.ink, marginBottom: spacing.s6 },
  authSub: { fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s20 },
  field: { marginBottom: spacing.s16 },
  label: { fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: spacing.s6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.s12,
    height: 44,
    backgroundColor: colors.surface,
  },
  inputRowFocused: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontSize: typography.fz14, color: colors.ink, marginLeft: spacing.s8 },
  divider: { height: 0.5, backgroundColor: colors.hairline, marginVertical: spacing.s10 },
  agreeRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.s6, gap: spacing.s10 },
  agreeCircle: {
    width: 18,
    height: 18,
    borderRadius: radii.r9,
    borderColor: colors.hairlineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  pwRule: { flexDirection: "row", alignItems: "center" },
  banner: { flexDirection: "row", alignItems: "flex-start", padding: spacing.s14, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
  requiredBadge: {
    fontSize: typography.fz10,
    color: colors.danger,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
  },
  fieldError: {
    fontSize: typography.fz12,
    color: colors.danger,
    marginTop: spacing.s4,
  },
  formError: {
    fontSize: typography.fz13,
    color: colors.danger,
    textAlign: "center" as const,
    marginTop: spacing.s8,
  },
});
