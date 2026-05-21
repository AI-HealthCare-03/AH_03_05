import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export const s = StyleSheet.create({
  spinner: { width: 84, height: 84, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12, paddingVertical: spacing.s8, alignSelf: 'stretch' },
  stepDot: { width: 22, height: 22, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radii.md, padding: spacing.s4, gap: spacing.s4, marginBottom: 14, borderWidth: 0.5, borderColor: colors.hairline },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: colors.accent50, borderWidth: 1, borderColor: colors.accent100 },
  tabText: { fontSize: typography.fz14, fontWeight: typography.fw6, color: colors.ink2 },
  tabTextActive: { color: colors.accent700 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.s12 },
});
