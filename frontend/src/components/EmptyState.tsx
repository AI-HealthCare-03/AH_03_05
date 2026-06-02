import React from 'react';
import { View, Text } from 'react-native';
import Icon from './Icon';
import Button from './Button';
import { colors, spacing, typography } from '../theme';

interface EmptyStateProps {
  icon: string;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.s40 }}>
      <Icon name={icon} size={36} color={colors.muted2} />
      {title ? (
        <Text
          style={{
            fontSize: typography.fz15,
            fontWeight: typography.fw6,
            color: colors.ink,
            marginTop: spacing.s12,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text
          style={{
            fontSize: typography.fz13,
            color: colors.muted,
            marginTop: spacing.s4,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          variant="primary"
          size="sm"
          style={{ marginTop: spacing.s16 }}
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

export default EmptyState;
