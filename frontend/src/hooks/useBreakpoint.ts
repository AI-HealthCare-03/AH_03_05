import { useWindowDimensions } from "react-native";

// ─── 브레이크포인트 기준 ──────────────────────────────────────────────────────
// mobile  : width < 768
// tablet  : 768 ≤ width < 1280
// desktop : width ≥ 1280
// ─────────────────────────────────────────────────────────────────────────────

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  const bp: Breakpoint = width >= 1280 ? "desktop" : width >= 768 ? "tablet" : "mobile";

  return {
    bp,
    isMobile: bp === "mobile",
    isTablet: bp === "tablet",
    isDesktop: bp === "desktop",
    width,
  };
}
