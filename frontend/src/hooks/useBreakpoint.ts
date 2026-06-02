import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

// Bootstrap 기준
// Mobile  : < 768  (xs/sm)
// Tablet  : 768 ~ 991  (md)
// Desktop : >= 992  (lg+)

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useDebouncedWebWidth(): number {
  const [width, setWidth] = useState(() => (Platform.OS === 'web' ? window.innerWidth : 0));
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setWidth(window.innerWidth), 300);
    };
    window.addEventListener('resize', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handler);
    };
  }, []);
  return width;
}

export function useBreakpoint() {
  const { width: nativeWidth } = useWindowDimensions();
  const webWidth = useDebouncedWebWidth();
  const width = Platform.OS === 'web' ? webWidth : nativeWidth;

  const breakpoint: Breakpoint = width >= 992 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';

  return {
    breakpoint,
    isDesktop: breakpoint === 'desktop',
    isTablet: breakpoint === 'tablet',
    isMobile: breakpoint === 'mobile',
    isTabletOrAbove: width >= 768,
    isDesktopOrAbove: width >= 992,
    width,
  };
}
