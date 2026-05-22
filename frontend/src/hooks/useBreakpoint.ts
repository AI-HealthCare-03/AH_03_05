import { useWindowDimensions } from "react-native";

// Bootstrap 기준
// Mobile  : < 768  (xs/sm)
// Tablet  : 768 ~ 991  (md)
// Desktop : >= 992  (lg+)

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  const breakpoint: Breakpoint = width >= 992 ? "desktop" : width >= 768 ? "tablet" : "mobile";

  return {
    breakpoint,
    isDesktop: breakpoint === "desktop",
    isTablet: breakpoint === "tablet",
    isMobile: breakpoint === "mobile",
    isTabletOrAbove: width >= 768,
    isDesktopOrAbove: width >= 992,
    width,
  };
}
