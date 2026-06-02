import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'accent' | 'default';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: ViewStyle;
}

const BG: Record<BadgeVariant, string> = {
  success: colors.success50,
  danger: colors.danger50,
  warning: colors.warning50,
  accent: colors.accent50,
  default: colors.surface2,
};

const FG: Record<BadgeVariant, string> = {
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
  accent: colors.accent700,
  default: colors.ink2,
};

export default function Badge({ variant = 'default', size = 'sm', children, style }: BadgeProps) {
  return (
    <View style={[s.base, { backgroundColor: BG[variant] }, style]}>
      <Text
        style={[
          s.text,
          { color: FG[variant], fontSize: size === 'sm' ? typography.fz11 : typography.fz12 },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: typography.fw6,
  },
});
