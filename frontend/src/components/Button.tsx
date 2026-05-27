import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle,
} from 'react-native';
import Icon from './Icon';
import { colors, radii, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: string;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  children: React.ReactNode;
  activeOpacity?: number;
}

const SIZE_HEIGHT: Record<ButtonSize, number | undefined> = {
  sm: undefined,
  md: 44,
  lg: 50,
};

const SIZE_PX: Record<ButtonSize, number> = {
  sm: spacing.s12,
  md: 14,
  lg: 14,
};

const SIZE_PY: Record<ButtonSize, number> = {
  sm: spacing.s8,
  md: 0,
  lg: 0,
};

const SIZE_FZ: Record<ButtonSize, number> = {
  sm: typography.fz12,
  md: typography.fz14,
  lg: typography.fz15,
};

const SIZE_ICON: Record<ButtonSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

const ICON_COLOR: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.accent700,
  ghost: colors.ink2,
  danger: colors.white,
};

const TEXT_STYLE: Record<ButtonVariant, keyof typeof s> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  ghost: 'textGhost',
  danger: 'textDanger',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled,
  loading,
  leftIcon,
  fullWidth,
  style,
  borderRadius,
  children,
  activeOpacity = 0.85,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = SIZE_HEIGHT[size];

  return (
    <TouchableOpacity
      style={[
        s.base,
        s[variant],
        {
          paddingHorizontal: SIZE_PX[size],
          paddingVertical: SIZE_PY[size],
          ...(height ? { height } : {}),
        },
        fullWidth && s.fullWidth,
        isDisabled && s.disabled,
        style,
        borderRadius !== undefined ? { borderRadius } : undefined,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'secondary' ? colors.accent : colors.white}
          size="small"
        />
      ) : (
        <>
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={SIZE_ICON[size]}
              color={ICON_COLOR[variant]}
            />
          )}
          <Text
            style={[
              s.text,
              s[TEXT_STYLE[variant]],
              { fontSize: SIZE_FZ[size] },
              leftIcon ? { marginLeft: spacing.s4 } : undefined,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },

  // Variants
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.accent50, borderWidth: 1, borderColor: colors.accent100 },
  ghost: { borderWidth: 1, borderColor: colors.hairlineStrong },
  danger: { backgroundColor: colors.danger },

  // Text
  text: { fontWeight: typography.fw7 },
  textPrimary: { color: colors.white },
  textSecondary: { color: colors.accent700, fontWeight: typography.fw6 },
  textGhost: { color: colors.ink2, fontWeight: typography.fw5 },
  textDanger: { color: colors.white },
});
