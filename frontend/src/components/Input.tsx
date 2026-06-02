import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import Icon from './Icon';
import { colors, radii, spacing, typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  icon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  multiline,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <View style={containerStyle}>
      {label && <Text style={s.label}>{label}</Text>}
      <View
        style={[
          s.row,
          !multiline && s.rowFixed,
          multiline && s.rowMultiline,
          !icon && s.plain,
          focused && !hasError && s.focused,
          hasError && s.errorBorder,
        ]}
      >
        {icon && (
          <Icon
            name={icon}
            size={16}
            color={hasError ? colors.danger : focused ? colors.accent : colors.muted}
          />
        )}
        <TextInput
          multiline={multiline}
          style={[
            s.input,
            icon && { marginLeft: spacing.s8 },
            { outlineStyle: 'none' } as any,
            style,
          ]}
          placeholderTextColor={colors.muted2}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {hasError && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontSize: typography.fz13,
    fontWeight: typography.fw6,
    color: colors.ink2,
    marginBottom: spacing.s8,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.s12,
    backgroundColor: colors.surface,
  },
  rowFixed: {
    height: 44,
    alignItems: 'center',
  },
  rowMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.s8,
  },
  plain: {
    // identical to row but without flexDirection (TextInput fills width naturally)
  },
  focused: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  errorBorder: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: typography.fz14,
    color: colors.ink,
  },
  error: {
    fontSize: typography.fz12,
    color: colors.danger,
    marginTop: spacing.s4,
  },
});
