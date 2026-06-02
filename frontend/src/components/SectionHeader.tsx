import React from 'react';
import { View, Text } from 'react-native';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

interface SectionHeaderProps {
  icon?: string;
  iconColor?: string;
  label: React.ReactNode;
  action?: React.ReactNode;
  mb?: number;
}

export function SectionHeader({
  icon,
  iconColor = colors.ink2,
  label,
  action,
  mb = spacing.s12,
}: SectionHeaderProps) {
  const labelNode =
    typeof label === 'string' ? (
      <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6, color: colors.ink }}>
        {label}
      </Text>
    ) : (
      label
    );

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: action ? 'space-between' : 'flex-start',
        alignItems: 'center',
        marginBottom: mb,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s6 }}>
        {icon && <Icon name={icon} size={14} color={iconColor} />}
        {labelNode}
      </View>
      {action}
    </View>
  );
}

export default SectionHeader;
