const mem: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((k: string) => Promise.resolve(mem[k] ?? null)),
    setItem: jest.fn((k: string, v: string) => {
      mem[k] = v;
      return Promise.resolve();
    }),
    removeItem: jest.fn((k: string) => {
      delete mem[k];
      return Promise.resolve();
    }),
  },
}));

import { medicationOverrideStore } from '../api/medicationOverrideStore';

const KEY = 'medipt_med_overrides';

describe('medicationOverrideStore', () => {
  beforeEach(async () => {
    for (const k in mem) delete mem[k];
    mem[KEY] = '{}';
    await medicationOverrideStore.load();
  });

  it('저장 안 된 medication은 null', () => {
    expect(medicationOverrideStore.get(1)).toBeNull();
  });

  it('set 후 get으로 조회되고 AsyncStorage에 영속', async () => {
    await medicationOverrideStore.set(19, { drugName: '타이레놀', duration: '7일' });
    expect(medicationOverrideStore.get(19)).toEqual({ drugName: '타이레놀', duration: '7일' });
    expect(JSON.parse(mem[KEY])['19'].drugName).toBe('타이레놀');
  });

  it('set은 기존 값과 병합 (duration만 갱신해도 drugName 유지)', async () => {
    await medicationOverrideStore.set(19, { drugName: '타이레놀', manufacturer: '한미' });
    await medicationOverrideStore.set(19, { duration: '14일' });
    expect(medicationOverrideStore.get(19)).toEqual({
      drugName: '타이레놀',
      manufacturer: '한미',
      duration: '14일',
    });
  });

  it('load로 저장값 복원', async () => {
    mem[KEY] = JSON.stringify({ 5: { drugName: '아스피린' } });
    await medicationOverrideStore.load();
    expect(medicationOverrideStore.get(5)?.drugName).toBe('아스피린');
  });

  it('손상된 저장값이면 안전하게 빈 상태', async () => {
    mem[KEY] = '{bad json';
    await medicationOverrideStore.load();
    expect(medicationOverrideStore.get(5)).toBeNull();
  });

  it('저장된 값이 없으면 기존 인메모리 유지(raw 없음)', async () => {
    await medicationOverrideStore.set(9, { duration: '3일' });
    delete mem[KEY];
    await medicationOverrideStore.load();
    expect(medicationOverrideStore.get(9)?.duration).toBe('3일');
  });
});
