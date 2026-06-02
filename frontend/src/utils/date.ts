/** ISO 날짜 문자열 → "YYYY.MM.DD" */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

/** ISO 타임스탬프 → 오늘이면 "HH:MM", 어제면 "어제", 그 외 "M월 D일" */
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

/** "HH:MM" 시간 문자열 → "오전/오후 H:MM" */
export function formatTimePeriod(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${displayH}:${String(m).padStart(2, '0')}`;
}

/** ISO 타임스탬프 → "YYYY.MM.DD 생성" (가이드 날짜용) */
export function formatGuideDate(timestamp: string): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day} 생성`;
}
