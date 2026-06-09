import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle;
  noPadding?: boolean;
  shadow?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function Card({
  children,
  style,
  containerStyle,
  noPadding,
  shadow,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const inner = (
    <View style={[s.card, noPadding && s.noPadding, shadow && s.shadow, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={containerStyle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s20,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  noPadding: {
    padding: 0,
  },
  shadow: {
    ...shadows.card,
  },
});
