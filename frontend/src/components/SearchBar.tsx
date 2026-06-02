import React, { useState } from 'react';
import { TextInput, ViewStyle } from 'react-native';
import Card from './Card';
import Button from './Button';
import Icon from './Icon';
import { colors, spacing, typography } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  action?: { label: string; onPress: () => void; loading?: boolean };
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '검색',
  onSubmit,
  autoFocus,
  action,
  style,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Card
      noPadding
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.s8,
          borderColor: focused ? colors.accent : colors.hairline,
          borderWidth: focused ? 1.5 : 0.5,
          height: 44,
          paddingHorizontal: spacing.s12,
        },
        style,
      ]}
    >
      <Icon name="search" size={16} color={focused ? colors.accent : colors.muted} />
      <TextInput
        style={
          { flex: 1, fontSize: typography.fz14, color: colors.ink, outlineStyle: 'none' } as any
        }
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType={onSubmit ? 'search' : 'done'}
        autoFocus={autoFocus}
      />
      {action && (
        <Button variant="primary" size="sm" loading={action.loading} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </Card>
  );
}

export default SearchBar;
