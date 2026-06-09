import { formatDate, formatRelativeTime, formatTimePeriod, formatGuideDate } from '../utils/date';

// formatRelativeTime은 "지금"을 기준으로 동작하므로 고정 날짜로 테스트
const FIXED_NOW = new Date('2024-03-15T12:00:00Z');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환한다', () => {
    expect(formatDate('2024-03-15T09:00:00Z')).toBe('2024.03.15');
  });

  it('월/일이 한 자리일 때 0을 붙인다', () => {
    expect(formatDate('2024-01-05T00:00:00Z')).toBe('2024.01.05');
  });

  it('빈 문자열이면 빈 문자열을 반환한다', () => {
    expect(formatDate('')).toBe('');
  });

  it('유효하지 않은 날짜 문자열이면 빈 문자열을 반환한다', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('날짜만 있는 문자열도 처리한다', () => {
    expect(formatDate('2024-12-31')).toBe('2024.12.31');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('오늘 날짜면 HH:MM 형식을 반환한다', () => {
    expect(formatRelativeTime('2024-03-15T09:30:00')).toBe('09:30');
  });

  it('시/분이 한 자리일 때 0을 붙인다', () => {
    expect(formatRelativeTime('2024-03-15T03:05:00')).toBe('03:05');
  });

  it('자정(00:00)도 올바르게 처리한다', () => {
    expect(formatRelativeTime('2024-03-15T00:00:00')).toBe('00:00');
  });

  it('어제 날짜면 "어제"를 반환한다', () => {
    expect(formatRelativeTime('2024-03-14T15:00:00')).toBe('어제');
  });

  it('이틀 전이면 "M월 D일" 형식을 반환한다', () => {
    expect(formatRelativeTime('2024-03-13T10:00:00')).toBe('3월 13일');
  });

  it('같은 해 다른 달이면 "M월 D일" 형식을 반환한다', () => {
    expect(formatRelativeTime('2024-01-01T00:00:00')).toBe('1월 1일');
  });

  it('undefined이면 빈 문자열을 반환한다', () => {
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('빈 문자열이면 빈 문자열을 반환한다', () => {
    expect(formatRelativeTime('')).toBe('');
  });
});

// ─── formatTimePeriod ─────────────────────────────────────────────────────────

describe('formatTimePeriod', () => {
  it('오전 시간을 올바르게 변환한다', () => {
    expect(formatTimePeriod('08:30')).toBe('오전 8:30');
  });

  it('오후 시간을 올바르게 변환한다', () => {
    expect(formatTimePeriod('13:05')).toBe('오후 1:05');
  });

  it('자정(00:00)은 오전 12:00으로 변환한다', () => {
    expect(formatTimePeriod('00:00')).toBe('오전 12:00');
  });

  it('정오(12:00)는 오후 12:00으로 변환한다', () => {
    expect(formatTimePeriod('12:00')).toBe('오후 12:00');
  });

  it('분이 한 자리일 때 0을 붙인다', () => {
    expect(formatTimePeriod('09:05')).toBe('오전 9:05');
  });

  it('오후 11:59도 올바르게 변환한다', () => {
    expect(formatTimePeriod('23:59')).toBe('오후 11:59');
  });
});

// ─── formatGuideDate ──────────────────────────────────────────────────────────

describe('formatGuideDate', () => {
  it('ISO 타임스탬프를 "YYYY.MM.DD 생성" 형식으로 변환한다', () => {
    expect(formatGuideDate('2024-03-15T09:00:00Z')).toBe('2024.03.15 생성');
  });

  it('월/일이 한 자리일 때 0을 붙인다', () => {
    expect(formatGuideDate('2024-01-05T00:00:00Z')).toBe('2024.01.05 생성');
  });

  it('12월 날짜도 올바르게 처리한다', () => {
    expect(formatGuideDate('2023-12-15T12:00:00Z')).toBe('2023.12.15 생성');
  });
});
