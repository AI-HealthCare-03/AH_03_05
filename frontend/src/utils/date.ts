/**
 * ISO 날짜 문자열을 "YYYY.MM.DD" 형식으로 변환합니다.
 * 빈 문자열이거나 유효하지 않은 날짜이면 빈 문자열을 반환합니다.
 *
 * @example formatDate('2024-03-15T09:00:00Z') // → '2024.03.15'
 */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

/**
 * ISO 타임스탬프를 상대적 시간 문자열로 변환합니다.
 * - 오늘: "HH:MM"
 * - 어제: "어제"
 * - 그 외: "M월 D일"
 *
 * @example
 * formatRelativeTime('2024-03-15T09:30:00Z') // 오늘이면 → '09:30'
 * formatRelativeTime(undefined) // → ''
 */
export function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * "HH:MM" 형식의 시간 문자열을 한국어 오전/오후 표기로 변환합니다.
 *
 * @example
 * formatTimePeriod('08:30') // → '오전 8:30'
 * formatTimePeriod('13:05') // → '오후 1:05'
 */
export function formatTimePeriod(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${displayH}:${String(m).padStart(2, '0')}`;
}

/**
 * ISO 타임스탬프를 가이드 생성 날짜 문자열로 변환합니다.
 *
 * @example formatGuideDate('2024-03-15T09:00:00Z') // → '2024.03.15 생성'
 */
export function formatGuideDate(timestamp: string): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day} 생성`;
}
