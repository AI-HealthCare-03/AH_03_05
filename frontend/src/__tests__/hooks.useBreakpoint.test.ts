import React, { useRef } from 'react';
import { act, create } from 'react-test-renderer';

const mockWidth = { native: 375, web: 1024 };
const mockPlatform = { OS: 'ios' as string };

jest.mock('react-native', () => ({
  Platform: { get OS() { return mockPlatform.OS; } },
  useWindowDimensions: () => ({ width: mockWidth.native, height: 812 }),
}));

// window 모킹 (web 분기 테스트용)
let capturedResizeHandler: (() => void) | null = null;
const mockAddEventListener = jest.fn((_: string, handler: () => void) => {
  capturedResizeHandler = handler;
});
const mockRemoveEventListener = jest.fn();
Object.defineProperty(global, 'window', {
  value: {
    get innerWidth() { return mockWidth.web; },
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  },
  writable: true,
});

import { useBreakpoint, Breakpoint } from '../hooks/useBreakpoint';

type BreakpointResult = ReturnType<typeof useBreakpoint>;

function TestComponent({ onResult }: { onResult: (v: BreakpointResult) => void }) {
  const result = useBreakpoint();
  const ref = useRef(onResult);
  ref.current(result);
  return null;
}

function render(width: number, platform: string = 'ios'): BreakpointResult {
  mockWidth.native = width;
  mockPlatform.OS = platform;
  let value!: BreakpointResult;
  act(() => {
    create(React.createElement(TestComponent, { onResult: v => { value = v; } }));
  });
  return value;
}

beforeEach(() => {
  mockPlatform.OS = 'ios';
  capturedResizeHandler = null;
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
});

describe('useBreakpoint — native', () => {
  it('375px → mobile', () => {
    const r = render(375);
    expect(r.breakpoint).toBe('mobile');
    expect(r.isMobile).toBe(true);
    expect(r.isTablet).toBe(false);
    expect(r.isDesktop).toBe(false);
    expect(r.isTabletOrAbove).toBe(false);
    expect(r.isDesktopOrAbove).toBe(false);
  });

  it('767px → mobile (tablet 경계 직전)', () => {
    const r = render(767);
    expect(r.breakpoint).toBe('mobile');
    expect(r.isTabletOrAbove).toBe(false);
  });

  it('768px → tablet', () => {
    const r = render(768);
    expect(r.breakpoint).toBe('tablet');
    expect(r.isTablet).toBe(true);
    expect(r.isTabletOrAbove).toBe(true);
    expect(r.isDesktopOrAbove).toBe(false);
  });

  it('991px → tablet (desktop 경계 직전)', () => {
    const r = render(991);
    expect(r.breakpoint).toBe('tablet');
  });

  it('992px → desktop', () => {
    const r = render(992);
    expect(r.breakpoint).toBe('desktop');
    expect(r.isDesktop).toBe(true);
    expect(r.isTabletOrAbove).toBe(true);
    expect(r.isDesktopOrAbove).toBe(true);
  });

  it('1440px → desktop', () => {
    const r = render(1440);
    expect(r.breakpoint).toBe('desktop');
  });

  it('width 값을 반환한다', () => {
    const r = render(500);
    expect(r.width).toBe(500);
  });
});

describe('useBreakpoint — web', () => {
  it('window.innerWidth 기준으로 breakpoint를 반환한다', () => {
    mockWidth.web = 1024;
    const r = render(0, 'web');
    expect(r.breakpoint).toBe('desktop');
    expect(r.isDesktop).toBe(true);
  });

  it('web 환경에서 resize 이벤트 리스너가 등록된다', () => {
    render(0, 'web');
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('web 환경에서 window.innerWidth=500 → mobile', () => {
    mockWidth.web = 500;
    const r = render(0, 'web');
    expect(r.breakpoint).toBe('mobile');
  });

  it('resize 핸들러 호출 시 debounce 타이머가 실행된다', () => {
    jest.useFakeTimers();
    render(0, 'web');
    expect(capturedResizeHandler).not.toBeNull();
    act(() => { capturedResizeHandler?.(); });
    act(() => { jest.runAllTimers(); });
    jest.useRealTimers();
  });

  it('언마운트 시 removeEventListener와 clearTimeout이 호출된다', () => {
    let renderer: any;
    act(() => {
      renderer = create(React.createElement(TestComponent, {
        onResult: () => {},
      }));
      mockPlatform.OS = 'web';
    });
    // 웹 환경으로 다시 렌더
    mockPlatform.OS = 'web';
    act(() => {
      renderer = create(React.createElement(TestComponent, { onResult: () => {} }));
    });
    act(() => { renderer.unmount(); });
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
