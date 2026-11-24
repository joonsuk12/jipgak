/** 만 원 단위 숫자를 읽기 쉬운 한국어 금액으로. 예: 35000 → "3억 5,000만 원", 3500 → "3,500만 원" */
export function formatManWon(man: number): string {
  if (!Number.isFinite(man) || man < 0) return '';
  const rounded = Math.round(man);
  const eok = Math.floor(rounded / 10_000);
  const rest = rounded % 10_000;
  if (eok === 0) return `${rest.toLocaleString('ko-KR')}만 원`;
  if (rest === 0) return `${eok.toLocaleString('ko-KR')}억 원`;
  return `${eok.toLocaleString('ko-KR')}억 ${rest.toLocaleString('ko-KR')}만 원`;
}

/** 원 단위 → 한국어 금액 (만 원 아래는 반올림) */
export function formatWon(won: number): string {
  return formatManWon(won / 10_000);
}

/** 입력 문자열에서 숫자만 남깁니다. "3,500" → "3500" */
export function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * 숫자와 소수점 하나(소수 둘째 자리까지)만 남깁니다. 면적용. "84.97㎡" → "84.97"
 * (아파트 전용면적은 84.97처럼 소수로 표기되는 경우가 많음)
 */
export function decimalOnly(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, 2)}`;
}

/** 오늘 날짜 'YYYY-MM-DD' (기기 시간대 기준). 엔진 밖인 화면에서만 씁니다. */
export function todayISO(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
