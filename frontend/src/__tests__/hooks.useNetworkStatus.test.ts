import React, { useRef } from 'react';
import { act, create } from 'react-test-renderer';

type NetInfoCallback = (state: { isConnected: boolean | null }) => void;
let capturedCallback: NetInfoCallback | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (cb: NetInfoCallback) => {
    capturedCallback = cb;
    return mockUnsubscribe;
  },
}));

import { useNetworkStatus } from '../hooks/useNetworkStatus';

function TestComponent({ onResult }: { onResult: (v: ReturnType<typeof useNetworkStatus>) => void }) {
  const result = useNetworkStatus();
  const ref = useRef(onResult);
  ref.current(result);
  return null;
}

beforeEach(() => {
  capturedCallback = null;
  mockUnsubscribe.mockClear();
});

describe('useNetworkStatus', () => {
  it('초기 상태는 isOffline=false', () => {
    let value: { isOffline: boolean } = { isOffline: true };
    act(() => { create(React.createElement(TestComponent, { onResult: v => { value = v; } })); });
    expect(value.isOffline).toBe(false);
  });

  it('isConnected=false → isOffline=true', () => {
    let value: { isOffline: boolean } = { isOffline: false };
    act(() => { create(React.createElement(TestComponent, { onResult: v => { value = v; } })); });
    act(() => { capturedCallback?.({ isConnected: false }); });
    expect(value.isOffline).toBe(true);
  });

  it('isConnected=true → isOffline=false', () => {
    let value: { isOffline: boolean } = { isOffline: false };
    act(() => { create(React.createElement(TestComponent, { onResult: v => { value = v; } })); });
    act(() => { capturedCallback?.({ isConnected: false }); });
    act(() => { capturedCallback?.({ isConnected: true }); });
    expect(value.isOffline).toBe(false);
  });

  it('isConnected=null → isOffline=false', () => {
    let value: { isOffline: boolean } = { isOffline: false };
    act(() => { create(React.createElement(TestComponent, { onResult: v => { value = v; } })); });
    act(() => { capturedCallback?.({ isConnected: null }); });
    expect(value.isOffline).toBe(false);
  });

  it('언마운트 시 unsubscribe가 호출된다', () => {
    let renderer: any;
    act(() => { renderer = create(React.createElement(TestComponent, { onResult: () => {} })); });
    act(() => { renderer.unmount(); });
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
