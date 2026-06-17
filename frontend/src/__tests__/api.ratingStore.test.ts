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

import { ratingStore } from '../api/ratingStore';

const KEY = 'medipt_message_ratings';

describe('ratingStore', () => {
  beforeEach(async () => {
    for (const k in mem) delete mem[k];
    mem[KEY] = '{}';
    await ratingStore.load(); // 인메모리 상태 초기화
  });

  it('저장 안 된 메시지는 null', () => {
    expect(ratingStore.get(123)).toBeNull();
  });

  it('set 후 get으로 조회되고 AsyncStorage에 영속', async () => {
    await ratingStore.set(123, 4);
    expect(ratingStore.get(123)).toBe(4);
    expect(mem[KEY]).toContain('123');
    expect(JSON.parse(mem[KEY])['123']).toBe(4);
  });

  it('load로 저장된 별점을 복원', async () => {
    mem[KEY] = JSON.stringify({ 7: 5 });
    await ratingStore.load();
    expect(ratingStore.get(7)).toBe(5);
  });

  it('손상된 저장값이면 안전하게 빈 상태', async () => {
    mem[KEY] = '{bad json';
    await ratingStore.load();
    expect(ratingStore.get(7)).toBeNull();
  });

  it('저장된 값이 없으면 빈 상태 유지', async () => {
    await ratingStore.set(9, 3);
    delete mem[KEY];
    await ratingStore.load(); // raw 없음 → 기존 인메모리 유지(예외 없음)
    expect(ratingStore.get(9)).toBe(3);
  });
});
