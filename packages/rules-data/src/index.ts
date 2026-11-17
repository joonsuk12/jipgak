import purchase from '../products/loan-newlywed-purchase.json';
import jeonse from '../products/loan-newlywed-jeonse.json';

/**
 * 앱에 내장하는 기본 규칙(JSON 원본).
 * 타입 검사는 rules-engine 쪽에서 합니다(이 패키지는 엔진에 의존하지 않음).
 */
export const products: readonly unknown[] = [purchase, jeonse];

/** 내장 규칙 버전: 출처 확인일 중 가장 최근 날짜 */
export const rulesVersion: string =
  [purchase, jeonse]
    .map((p) => p.source.checkedAt)
    .sort()
    .at(-1) ?? '0000-00-00';
