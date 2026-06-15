jest.mock('../api/tokenStore', () => ({
  tokenStore: { accessToken: null, refreshToken: null, save: jest.fn(), clear: jest.fn() },
}));

import { resolveApiBaseUrl } from '../api/client';

describe('resolveApiBaseUrl', () => {
  it('EXPO_PUBLIC_API_URL이 있으면 그 값을 사용', () => {
    expect(resolveApiBaseUrl('https://medipt05.store/api/v1', undefined)).toBe(
      'https://medipt05.store/api/v1'
    );
  });

  it('env 없고 웹 호스트가 localhost가 아니면 현재 origin 기준 /api/v1', () => {
    expect(
      resolveApiBaseUrl(undefined, {
        hostname: 'medipt05.store',
        origin: 'https://medipt05.store',
      })
    ).toBe('https://medipt05.store/api/v1');
  });

  it('env 없고 호스트가 localhost면 localhost fallback', () => {
    expect(
      resolveApiBaseUrl(undefined, {
        hostname: 'localhost',
        origin: 'http://localhost:8081',
      })
    ).toBe('http://localhost:80/api/v1');
  });

  it('env 없고 window도 없으면(네이티브) localhost fallback', () => {
    expect(resolveApiBaseUrl(undefined, undefined)).toBe('http://localhost:80/api/v1');
  });

  it('env가 빈 문자열이면 fallback으로 넘어감', () => {
    expect(
      resolveApiBaseUrl('', { hostname: 'medipt05.store', origin: 'https://medipt05.store' })
    ).toBe('https://medipt05.store/api/v1');
  });
});
