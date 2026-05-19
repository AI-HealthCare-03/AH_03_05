// MediPT — Design tokens (ported from styles.css CSS variables)

export const colors = {
  // Accent (teal default)
  accent: "#0891B2",
  accent700: "#0E7490",
  accent50: "#ECFCFE",
  accent100: "#CFFAFE",
  accentOn: "#ffffff",

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
  warning: "#D97706",
  warning50: "#FEF3C7",
  danger: "#DC2626",
  danger50: "#FEE2E2",

  white: "#ffffff",
  black: "#000000",
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 9999,
};

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 40,
  s9: 56,
};

export const typography = {
  fz11: 11,
  fz12: 12,
  fz13: 13,
  fz14: 14,
  fz15: 15,
  fz17: 17,
  fz22: 22,
  fz26: 26,
  fw4: "400" as const,
  fw5: "500" as const,
  fw6: "600" as const,
  fw7: "700" as const,
};
