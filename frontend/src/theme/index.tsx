export const colors = {
  canvas: "#f8fafc",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  white: "#ffffff",
  ink: "#0f172a",
  ink2: "#334155",
  muted: "#64748b",
  muted2: "#94a3b8",
  hairline: "#e2e8f0",
  hairlineStrong: "#cbd5e1",
  accent: "#0891B2",
  accent50: "#ECF9FF",
  accent100: "#BAE6FD",
  accent700: "#0E7490",
  success: "#16a34a",
  success50: "#dcfce7",
  danger: "#dc2626",
  danger50: "#fee2e2",
  warning: "#d97706",
  warning50: "#fef3c7",
};

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const typography = {
  fz11: 11,
  fz12: 12,
  fz13: 13,
  fz14: 14,
  fz15: 15,
  fz16: 16,
  fz18: 18,
  fz22: 22,
  fw4: "400" as const,
  fw5: "500" as const,
  fw6: "600" as const,
  fw7: "700" as const,
};

export const shadow = {
  sm: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  card: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

// ─── 공통 UI 컴포넌트 ─────────────────────────────────────────────────────────
// import { AppInput, AppCard, PrimaryButton, GhostButton, uiStyles } from '../../theme'

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ViewStyle, TextStyle, TextInputProps,
} from "react-native";

// ─── AppInput ─────────────────────────────────────────────────────────────────
// 기본: borderRadius md, borderColor hairlineStrong (ChatList 검색창 스타일)
// 포커스: borderColor accent (OCR SearchBar 스타일)
type AppInputProps = TextInputProps & {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputHeight?: number;
};

export function AppInput({
  containerStyle,
  inputStyle,
  multiline = false,
  inputHeight,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...rest
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const height = inputHeight ?? (multiline ? 80 : 46);

  return (
    <View
      style={[
        inp.wrap,
        { height: multiline ? undefined : height },
        multiline && { paddingVertical: 10, minHeight: height },
        focused && inp.wrapFocused,
        containerStyle,
      ]}>
      <TextInput
        style={[
          inp.input,
          { height: multiline ? height : "100%" as any },
          multiline && { textAlignVertical: "top" },
          { outlineWidth: 0, outlineStyle: "none" } as any,
          inputStyle,
        ]}
        multiline={multiline}
        onFocus={(e) => { setFocused(true); onFocusProp?.(e); }}
        onBlur={(e) => { setFocused(false); onBlurProp?.(e); }}
        placeholderTextColor={colors.muted2}
        {...rest}
      />
    </View>
  );
}

const inp = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    backgroundColor: colors.canvas,
    justifyContent: "center",
  },
  wrapFocused: { borderColor: colors.accent },
  input: { fontSize: 14, color: colors.ink, padding: 0 },
});

// ─── AppCard ──────────────────────────────────────────────────────────────────
export function AppCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[uiStyles.card, style]}>{children}</View>;
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────
type BtnProps = { children: React.ReactNode; onPress: () => void; style?: ViewStyle; disabled?: boolean; danger?: boolean };

export function PrimaryButton({ children, onPress, style, disabled, danger }: BtnProps) {
  return (
    <TouchableOpacity
      style={[uiStyles.btnPrimary, danger && { backgroundColor: colors.danger }, disabled && { opacity: 0.4 }, style]}
      onPress={onPress} disabled={disabled} activeOpacity={0.85}>
      {typeof children === "string"
        ? <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>{children}</Text>
        : children}
    </TouchableOpacity>
  );
}

// ─── GhostButton ─────────────────────────────────────────────────────────────
export function GhostButton({ children, onPress, style, disabled }: BtnProps) {
  return (
    <TouchableOpacity
      style={[uiStyles.btnGhost, disabled && { opacity: 0.4 }, style]}
      onPress={onPress} disabled={disabled} activeOpacity={0.85}>
      {typeof children === "string"
        ? <Text style={{ color: colors.ink2, fontSize: 14, fontWeight: "500" }}>{children}</Text>
        : children}
    </TouchableOpacity>
  );
}

// ─── uiStyles (TouchableOpacity 등에 직접 쓸 경우용) ─────────────────────────
export const uiStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.s4,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btnPrimary: {
    flexDirection: "row",
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s4,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.s4,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
