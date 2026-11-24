import type { Amount } from './answers';

/**
 * 순자산 계산 도우미의 항목 (D-18). 산정 기준은 docs/sources/income-and-assets.md 2절.
 * 금액은 만 원 단위 문자열이며, 빈칸 = 해당 없음(0), null = 모름.
 */
export type AssetKey =
  | 'deposit'
  | 'checking'
  | 'savings'
  | 'stocks'
  | 'pension'
  | 'insurance'
  | 'car'
  | 'realEstate'
  | 'presale'
  | 'loans'
  | 'cardOverdue'
  | 'leaseDeposit';

export interface AssetItem {
  key: AssetKey;
  label: string;
  hint: string;
  /** 1 = 더하는 것(자산), -1 = 빼는 것(부채) */
  sign: 1 | -1;
}

export const ASSET_ITEMS: AssetItem[] = [
  {
    key: 'deposit',
    label: '지금 사는 집의 전세보증금',
    hint: '돌려받을 돈이라 자산으로 쳐요. 월세 보증금도 넣어요.',
    sign: 1,
  },
  {
    key: 'checking',
    label: '입출금 통장',
    hint: '지금 잔액이 아니라 최근 3개월 평균 잔액이에요.',
    sign: 1,
  },
  { key: 'savings', label: '예금·적금', hint: '지금 잔액이나 지금까지 넣은 금액이에요.', sign: 1 },
  { key: 'stocks', label: '주식·펀드', hint: '지금 평가 금액이에요.', sign: 1 },
  {
    key: 'pension',
    label: '연금저축·퇴직연금',
    hint: '연금을 받기 전이라면 지금 잔액이에요.',
    sign: 1,
  },
  { key: 'insurance', label: '보험', hint: '지금 해약하면 돌려받는 금액이에요.', sign: 1 },
  {
    key: 'car',
    label: '자동차',
    hint: '시세가 아니라 시가표준액이에요.',
    sign: 1,
  },
  {
    key: 'realEstate',
    label: '토지·건물',
    hint: '시세가 아니라 시가표준액(공시가격 기준)이에요.',
    sign: 1,
  },
  { key: 'presale', label: '분양권', hint: '지금까지 낸 금액이에요.', sign: 1 },
  {
    key: 'loans',
    label: '금융기관 대출 잔액',
    hint: '마이너스통장은 빼 주지 않으니 넣지 마세요.',
    sign: -1,
  },
  {
    key: 'cardOverdue',
    label: '밀린 카드 대금',
    hint: '3개월 넘게 50만 원 이상 밀린 금액만 빼 줘요.',
    sign: -1,
  },
  {
    key: 'leaseDeposit',
    label: '세놓은 상가·오피스텔 보증금',
    hint: '돌려줘야 할 돈이라 빼요.',
    sign: -1,
  },
];

export type AssetItemValues = Record<AssetKey, Amount>;

export function emptyAssetItems(): AssetItemValues {
  return Object.fromEntries(ASSET_ITEMS.map((i) => [i.key, ''])) as AssetItemValues;
}

export type AssetSum =
  | { kind: 'empty' }
  | { kind: 'unknown'; unknownLabels: string[] }
  | { kind: 'total'; total: number };

/**
 * 항목 합계(만 원). 하나라도 모름이면 합계도 모름, 아무것도 안 넣었으면 empty.
 * 화면 상태만 다루는 순수 함수이며, 값은 기기 밖으로 보내지 않습니다.
 */
export function sumAssetItems(values: AssetItemValues): AssetSum {
  const unknownLabels = ASSET_ITEMS.filter((i) => values[i.key] === null).map((i) => i.label);
  if (unknownLabels.length > 0) return { kind: 'unknown', unknownLabels };
  let total = 0;
  let entered = false;
  for (const item of ASSET_ITEMS) {
    const raw = values[item.key];
    if (raw === null || raw.trim() === '') continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    entered = true;
    total += item.sign * n;
  }
  return entered ? { kind: 'total', total } : { kind: 'empty' };
}

/** 합계를 순자산 칸 값으로. 빚이 더 많으면 0으로 넣습니다(자격 판정 결과는 같음). */
export function toNetAssetsAnswer(sum: AssetSum): Amount | undefined {
  if (sum.kind === 'empty') return undefined;
  if (sum.kind === 'unknown') return null;
  return String(Math.max(0, sum.total));
}
