import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '../../components/Icon';
import { colors, radii, spacing, typography } from '../../theme';

export function Rule({ ok, children }: { ok: boolean; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s4 }}>
      <Icon name={ok ? 'check-circle' : 'x'} size={13} color={ok ? colors.success : colors.muted} />
      <Text style={{ fontSize: typography.fz12, color: ok ? colors.success : colors.muted, marginLeft: spacing.s4 }}>{children}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  chip: { paddingHorizontal: spacing.s10, paddingVertical: spacing.s6, borderRadius: radii.pill, backgroundColor: colors.surface2 },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent, borderWidth: 1 },
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.s20, paddingVertical: spacing.s16, gap: 14 },
  rowLabel: { flex: 1, fontSize: typography.fz14, fontWeight: typography.fw5, color: colors.ink },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.s14, borderRadius: radii.md },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.s20, paddingVertical: spacing.s16, gap: spacing.s12 },
  notifIcon: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  timeInput: { borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: spacing.s8, height: 36, fontSize: typography.fz13, color: colors.ink, width: 80, textAlign: 'center' },
});
