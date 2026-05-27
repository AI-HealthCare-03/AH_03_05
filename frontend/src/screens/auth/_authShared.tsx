import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../../navigation/types';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';

export type AuthNavProp = NativeStackNavigationProp<AuthStackParams>;

// ─── BrandPanel (desktop left panel) ─────────────────────────────────────────

export function BrandPanel({ tagline, desc, features }: {
  tagline: React.ReactNode; desc: string; features: { icon: string; title: string; sub: string }[];
}) {
  return (
    <View style={bp.panel}>
      {/* 브랜드 로고 — 패널 최상단 고정 */}
      <View style={bp.brandRow}>
        <View style={bp.logo}><Icon name="robot" size={16} color={colors.white} /></View>
        <Text style={bp.brandName}>MediPT</Text>
      </View>

      {/* 메인 컨텐츠 — 나머지 공간에서 수직 중앙 */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={bp.tagline}>{tagline}</Text>
        <Text style={bp.desc}>{desc}</Text>
        {features.map((f, i) => (
          <View key={i} style={bp.feat}>
            <View style={bp.featIcon}><Icon name={f.icon} size={16} color={colors.white} /></View>
            <View style={{ flex: 1 }}>
              <Text style={bp.featTitle}>{f.title}</Text>
              <Text style={bp.featSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const bp = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: spacing.s40,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s8 },
  logo: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.white },
  tagline: { fontSize: typography.fz26, fontWeight: typography.fw7, color: colors.white, lineHeight: 36, marginBottom: 14 },
  desc: { fontSize: typography.fz14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 28 },
  feat: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s12, marginBottom: 16 },
  featIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.white, marginBottom: 2 },
  featSub: { fontSize: typography.fz12, color: 'rgba(255,255,255,0.75)' },
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s24,
  },
  brandLogo: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.s8,
  },
  brandName: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  authTitle: { fontSize: 24, fontWeight: typography.fw7, color: colors.ink, marginBottom: 6 },
  authSub:   { fontSize: typography.fz14, color: colors.muted, marginBottom: spacing.s20 },
  field:     { marginBottom: spacing.s16 },
  label:     { fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink2, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.hairlineStrong,
    borderRadius: radii.md, paddingHorizontal: spacing.s12, height: 44,
    backgroundColor: colors.surface,
  },
  inputRowFocused: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontSize: typography.fz14, color: colors.ink, marginLeft: spacing.s8 },
  divider: { height: 0.5, backgroundColor: colors.hairline, marginVertical: 10 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  agreeCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderColor: colors.hairlineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  pwRule: { flexDirection: 'row', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: radii.md },
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
    textAlign: 'center' as const,
    marginTop: spacing.s8,
  },
});

