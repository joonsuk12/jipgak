/**
 * 흔한 아파트 평형(공급면적)과 그에 흔히 대응하는 전용면적 (D-23, D-25).
 * 화면은 평형을 앞에 보여 주고, 판정은 전용면적으로 합니다(대출 조건이 전용 85㎡ 기준).
 * 평형 ↔ 전용 대응은 단지마다 조금씩 달라 "흔히"로만 안내합니다.
 */
export const PYEONG_TYPES = [
  { type: '25평형', range: '24~25평형', m2: 59 },
  { type: '30평형', range: '29~30평형', m2: 74 },
  { type: '34평형', range: '33~34평형', m2: 84 },
] as const;

/** 이 정도 차이까지는 "안팎"으로 봅니다 (㎡) */
const NEAR = 1.5;

/**
 * 전용면적을 위 흔한 평형 기준으로 말로 바꿉니다. 새 환산 비율을 만들지 않고 세 기준점 사이만 말합니다.
 * 예: 65.6 → "25~30평형 사이", 84 → "34평형 안팎", 44 → "25평형보다 작아요"
 */
export function describePyeongType(m2: number): string {
  const [small, mid, large] = PYEONG_TYPES;
  for (const t of PYEONG_TYPES) {
    if (Math.abs(m2 - t.m2) <= NEAR) return `흔히 ${t.type} 안팎`;
  }
  if (m2 < small.m2) return `${small.type}보다 작아요`;
  if (m2 < mid.m2) return `${small.type.replace('평형', '')}~${mid.type} 사이`;
  if (m2 < large.m2) return `${mid.type.replace('평형', '')}~${large.type} 사이`;
  return `${large.type}보다 커요`;
}
