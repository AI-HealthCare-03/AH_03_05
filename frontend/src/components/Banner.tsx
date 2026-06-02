import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Icon from './Icon';
import { colors, radii, spacing, typography } from '../theme';

type BannerVariant = 'success' | 'danger' | 'warning' | 'info';

interface VariantConfig {
  bg: string;
  border?: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  defaultIcon: string;
}

const VARIANTS: Record<BannerVariant, VariantConfig> = {
  success: {
    bg: colors.success50,
    iconColor: colors.success,
    titleColor: colors.ink,
    bodyColor: colors.ink2,
    defaultIcon: 'check-circle',
  },
  danger: {
    bg: colors.danger50,
    border: colors.danger,
    iconColor: colors.danger,
    titleColor: colors.danger,
    bodyColor: colors.danger,
    defaultIcon: 'alert',
  },
  warning: {
    bg: colors.warning50,
    iconColor: colors.warning,
    titleColor: colors.warningText,
    bodyColor: colors.warningText,
    defaultIcon: 'alert',
  },
  info: {
    bg: colors.accent50,
    border: colors.accent100,
    iconColor: colors.accent700,
    titleColor: colors.ink,
    bodyColor: colors.accent700,
    defaultIcon: 'info',
  },
};

interface BannerProps {
  variant: BannerVariant;
  title?: string;
  body?: string;
  icon?: string | null;  // null = 아이콘 없음, undefined = variant 기본 아이콘
  style?: ViewStyle;
}

export function Banner({ variant, title, body, icon, style }: BannerProps) {
  const cfg = VARIANTS[variant];
  const iconName = icon === null ? null : (icon ?? cfg.defaultIcon);

  return (
    <View style={[
      {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: cfg.bg,
        borderRadius: radii.md,
        padding: spacing.s12,
      },
      cfg.border ? { borderWidth: 1, borderColor: cfg.border } : undefined,
      style,
    ]}>
      {iconName != null && (
        <View style={{ marginTop: 1 }}>
          <Icon name={iconName} size={16} color={cfg.iconColor} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: iconName != null ? spacing.s8 : 0 }}>
        {title != null && (
          <Text style={{
            fontSize: typography.fz14,
            fontWeight: typography.fw7,
            color: cfg.titleColor,
            marginBottom: body != null ? spacing.s2 : 0,
          }}>
            {title}
          </Text>
        )}
        {body != null && (
          <Text style={{ fontSize: typography.fz13, color: cfg.bodyColor, lineHeight: 20 }}>
            {body}
          </Text>
        )}
      </View>
    </View>
  );
}

export default Banner;
