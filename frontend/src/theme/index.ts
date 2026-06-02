import { Platform } from 'react-native';

export const colors = {
  // Accent (teal)
  accent: "#0891B2",
  accentLight: "#4EC8DC",
  accent700: "#0E7490",
  accent50: "#ECFCFE",
  accent100: "#CFFAFE",
  accentAlpha30: "rgba(8,145,178,0.3)",
  accentAlpha25: "rgba(8,145,178,0.25)",
  accentOn: "#ffffff",

  // On-accent (white-alpha — text/elements on accent-colored backgrounds)
  onAccent85: "rgba(255,255,255,0.85)",
  onAccent80: "rgba(255,255,255,0.8)",
  onAccent75: "rgba(255,255,255,0.75)",
  onAccent60: "rgba(255,255,255,0.6)",
  onAccent25: "rgba(255,255,255,0.25)",
  onAccent20: "rgba(255,255,255,0.2)",

  // Canvas / Surface
  canvas: "#F0F9FF",
  surface: "#ffffff",
  surface2: "#F8FAFB",

  // Ink
  ink: "#0F172A",
  ink2: "#334155",
  muted: "#64748B",
  muted2: "#94A3B8",

  // Hairline
  hairline: "#E2E8F0",
  hairlineStrong: "#CBD5E1",

  // Status
  success: "#059669",
  success50: "#D1FAE5",
  successText: "#065F46",
  warning: "#D97706",
  warning50: "#FEF3C7",
  warningText: "#92400E",
  danger: "#DC2626",
  danger50: "#FEE2E2",

  // Schedule (가이드 복약 시간대)
  scheduleMorning: "#0EA5E9",
  scheduleLunch: "#10B981",
  scheduleEvening: "#8B5CF6",

  // Overlay
  scrim: "rgba(0,0,0,0.45)",

  // Base
  white: "#ffffff",
  black: "#000000",
};

export const radii = {
  r2: 2,
  xs: 3,
  checkbox: 6,
  sm: 8,
  r9: 9,
  icon: 10,
  md: 12,
  bubble: 14,
  lg: 18,
  r16: 16,
  xl: 20,
  pill: 9999,
};

export const spacing = {
  s2: 2,
  s3: 3,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s18: 18,
  s20: 20,
  s22: 22,
  s24: 24,
  s32: 32,
  s40: 40,
  s48: 48,
  s56: 56,
  safeTop: 52,
};

export const typography = {
  fz10: 10,
  fz11: 11,
  fz12: 12,
  fz13: 13,
  fz14: 14,
  fz15: 15,
  fz16: 16,
  fz17: 17,
  fz18: 18,
  fz20: 20,
  fz22: 22,
  fz24: 24,
  fz26: 26,
  fz36: 36,
  fz48: 48,
  fw4: "400" as const,
  fw5: "500" as const,
  fw6: "600" as const,
  fw7: "700" as const,
  lh20: 20,
  lh22: 22,
};

export const shadows = {
  card: {
    ...(Platform.OS !== 'web'
      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
      : { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' } as any),
    elevation: 2,
  },
  float: {
    ...(Platform.OS !== 'web'
      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }
      : { boxShadow: '0px 2px 6px rgba(0,0,0,0.08)' } as any),
    elevation: 3,
  },
  drawer: {
    ...(Platform.OS !== 'web'
      ? { shadowColor: "#000", shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 20 }
      : { boxShadow: '-4px 0px 20px rgba(0,0,0,0.12)' } as any),
    elevation: 16,
  },
};
