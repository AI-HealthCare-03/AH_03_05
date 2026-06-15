// 스크린이 api 인덱스 → tokenStore → AsyncStorage(네이티브)를 끌고 오므로 import 통과용 스텁.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

import { resolveResultRecordId } from '../screens/ocr/OCRProcessingScreen';

describe('resolveResultRecordId', () => {
  const fallback = 7;

  it('유효한 양의 정수 문자열이면 그 값을 채택', () => {
    expect(resolveResultRecordId('42', fallback)).toBe(42);
    expect(resolveResultRecordId(' 42 ', fallback)).toBe(42);
  });

  it('null·undefined·빈 문자열이면 폴백(recordId)', () => {
    expect(resolveResultRecordId(null, fallback)).toBe(fallback);
    expect(resolveResultRecordId(undefined, fallback)).toBe(fallback);
    expect(resolveResultRecordId('', fallback)).toBe(fallback);
  });

  it('비숫자·소수·0·음수·혼합 문자열이면 폴백', () => {
    expect(resolveResultRecordId('abc', fallback)).toBe(fallback);
    expect(resolveResultRecordId('42.5', fallback)).toBe(fallback);
    expect(resolveResultRecordId('0', fallback)).toBe(fallback);
    expect(resolveResultRecordId('-3', fallback)).toBe(fallback);
    expect(resolveResultRecordId('42abc', fallback)).toBe(fallback);
  });

  it('폴백 recordId 자체가 undefined여도 안전하게 undefined 반환', () => {
    expect(resolveResultRecordId(null, undefined)).toBeUndefined();
  });
});
