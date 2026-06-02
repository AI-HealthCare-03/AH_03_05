import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  chevron?: boolean;
  iconColor?: string;
  labelColor?: string;
  separator?: boolean;
}

export const MenuItem = React.memo(function MenuItem({
  icon,
  label,
  onPress,
  chevron = true,
  iconColor = colors.accent700,
  labelColor = colors.ink,
  separator = false,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.s20,
          paddingVertical: spacing.s16,
          gap: 14,
        },
        separator && { borderTopWidth: 0.5, borderTopColor: colors.hairline },
      ]}
      onPress={onPress}
    >
      <Icon name={icon} size={16} color={iconColor} />
      <Text
        style={{
          flex: 1,
          fontSize: typography.fz14,
          fontWeight: typography.fw5,
          color: labelColor,
        }}
      >
        {label}
      </Text>
      {chevron && <Icon name="chevron-right" size={14} color={colors.muted2} />}
    </TouchableOpacity>
  );
});

export default MenuItem;
