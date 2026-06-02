import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export const s = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: spacing.s12, backgroundColor: colors.surface, alignSelf: 'stretch' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s8, padding: spacing.s16, backgroundColor: colors.surface, borderTopWidth: 0.5, borderTopColor: colors.hairline },
  chatInput: { flex: 1, borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radii.md, paddingHorizontal: spacing.s12, paddingVertical: 10, fontSize: typography.fz14, color: colors.ink, maxHeight: 100, backgroundColor: colors.surface },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s8, marginBottom: spacing.s14 },
  bubble: { maxWidth: '70%', padding: spacing.s12, borderRadius: 14 },
  bubbleUser: { backgroundColor: colors.accent },
  bubbleAI:  { backgroundColor: colors.surface2, borderWidth: 0.5, borderColor: colors.hairline },
  aiAvatar: { width: 28, height: 28, borderRadius: radii.pill, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 28, height: 28, borderRadius: radii.pill, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },
  warnBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning50, borderRadius: radii.md, padding: spacing.s12, marginBottom: spacing.s14 },
});
