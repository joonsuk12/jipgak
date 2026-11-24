/**
 * 가구원 수별 평균 전용면적 (화면 참고용, 판정에 쓰지 않음).
 * 원본과 한계: docs/sources/household-area.md
 */
export const HOUSEHOLD_AREA_SOURCE = {
  label: '국토교통부 2019년 주거실태조사를 주택산업연구원이 재분석한 값',
  url: 'http://www.plus-h.co.kr/data/plus-h_202103/sub/sub3_06.html',
} as const;

export const HOUSEHOLD_AREA = [
  { members: '1인', m2: 44.0 },
  { members: '2인', m2: 65.6 },
  { members: '3인', m2: 74.8 },
  { members: '4인', m2: 79.7 },
  { members: '5인 이상', m2: 87.1 },
] as const;
