import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../theme';

export const s = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: colors.canvas },
  banner: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.s12, borderRadius: radii.md },
  bannerSuccess: { backgroundColor: colors.success50 },
  bannerWarn:    { backgroundColor: colors.warning50 },
  docPreview: { height: 140, backgroundColor: colors.accent50, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: radii.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  drugCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12, padding: 14, borderRadius: radii.md, marginBottom: spacing.s8 },
  drugDot: { width: 28, height: 28, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: spacing.s10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.hairlineStrong },
  chipActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  spinnerWrap: { width: 84, height: 84, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.s16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12, paddingVertical: spacing.s8, alignSelf: 'stretch' },
  stepDot: { width: 24, height: 24, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden', flexDirection: 'row', alignSelf: 'stretch' },
  progressFill: { backgroundColor: colors.accent },
});
