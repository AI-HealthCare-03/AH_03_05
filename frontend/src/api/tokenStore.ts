import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = { access: 'medipt_access_token', refresh: 'medipt_refresh_token' } as const;

let _access: string | null = null;
let _refresh: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export const tokenStore = {
  get accessToken() {
    return _access;
  },
  get refreshToken() {
    return _refresh;
  },

  async load() {
    const [a, r] = await Promise.all([
      AsyncStorage.getItem(KEYS.access),
      AsyncStorage.getItem(KEYS.refresh),
    ]);
    _access = a;
    _refresh = r;
  },

  async save(access: string, refresh: string) {
    _access = access;
    _refresh = refresh;
    try {
      await Promise.all([
        AsyncStorage.setItem(KEYS.access, access),
        AsyncStorage.setItem(KEYS.refresh, refresh),
      ]);
    } catch {}
  },

  async clear() {
    _access = null;
    _refresh = null;
    await Promise.all([
      AsyncStorage.removeItem(KEYS.access),
      AsyncStorage.removeItem(KEYS.refresh),
    ]);
  },

  registerUnauthorizedHandler(cb: () => void) {
    _onUnauthorized = cb;
  },

  triggerUnauthorized() {
    _onUnauthorized?.();
  },
};
