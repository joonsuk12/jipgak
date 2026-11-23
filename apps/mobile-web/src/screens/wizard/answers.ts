import type { UserProfile } from '@jipgak/rules-engine';

/**
 * 입력 위저드의 답. 화면 상태 그대로이며, toProfile()로 엔진 입력(UserProfile)으로 바꿉니다.
 * - 선택형: null = 아직 고르지 않음, 'unknown' = 모름. 둘 다 엔진에는 "모름"(키 없음)으로 갑니다.
 * - 금액: 만 원 단위 숫자 문자열. '' = 비어 있음, null = 모름.
 */
export type Purpose = 'purchase' | 'jeonse' | 'both';
export type Choice<T extends string> = T | 'unknown' | null;
export type YesNo = Choice<'yes' | 'no'>;
export type Amount = string | null;

export interface HomeAnswers {
  region: Choice<'metro' | 'local'>;
  /** 구입만: 규제지역 */
  regulated: YesNo;
  /** 매매가 또는 보증금 (만 원) */
  amount: Amount;
  /** 전용면적 ㎡ */
  area: Amount;
  /** 수도권 외 + 85㎡ 초과일 때만 묻는 읍·면 여부 */
  ruralTownship: YesNo;
  contract: YesNo;
}

export interface Answers {
  purpose: Purpose | null;
  marriageStatus: 'married' | 'planned' | null;
  marriageDate: string | null;
  children: Choice<'0' | '1' | '2' | '3'>;
  applicantIncome: Amount;
  spouseIncome: Amount;
  netAssets: Amount;
  allHomeless: YesNo;
  everOwnedHome: YesNo;
  everHadFundPurchaseLoan: YesNo;
  hasFundLoan: YesNo;
  hasMortgageLoan: YesNo;
  hasJeonseLoan: YesNo;
  livesInPublicRental: YesNo;
  purchase: HomeAnswers;
  jeonse: HomeAnswers;
}

const emptyHome = (): HomeAnswers => ({
  region: null,
  regulated: null,
  amount: '',
  area: '',
  ruralTownship: null,
  contract: null,
});

export function emptyAnswers(): Answers {
  return {
    purpose: null,
    marriageStatus: null,
    marriageDate: '',
    children: null,
    applicantIncome: '',
    spouseIncome: '',
    netAssets: '',
    allHomeless: null,
    everOwnedHome: null,
    everHadFundPurchaseLoan: null,
    hasFundLoan: null,
    hasMortgageLoan: null,
    hasJeonseLoan: null,
    livesInPublicRental: null,
    purchase: emptyHome(),
    jeonse: emptyHome(),
  };
}

export const wantsPurchase = (a: Answers) => a.purpose === 'purchase' || a.purpose === 'both';
export const wantsJeonse = (a: Answers) => a.purpose === 'jeonse' || a.purpose === 'both';

export type StepId =
  | 'purpose'
  | 'marriage'
  | 'income'
  | 'assets'
  | 'history'
  | 'purchaseHome'
  | 'jeonseHome'
  | 'result';

/** 목적에 따라 보여 줄 단계 */
export function visibleSteps(a: Answers): StepId[] {
  const steps: StepId[] = ['purpose', 'marriage', 'income', 'assets', 'history'];
  if (wantsPurchase(a)) steps.push('purchaseHome');
  if (wantsJeonse(a)) steps.push('jeonseHome');
  steps.push('result');
  return steps;
}

/** 수도권 외 지역에서 85㎡를 넘을 때만 읍·면 여부를 묻습니다(100㎡까지 인정되는 예외). */
export function asksRuralTownship(home: HomeAnswers): boolean {
  const area = toNumber(home.area);
  return home.region === 'local' && area !== undefined && area > 85;
}

// ───────────────────────── UserProfile 변환 ─────────────────────────

const MAN = 10_000;

function toNumber(value: Amount): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value.replaceAll(',', ''));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function won(value: Amount): number | undefined {
  const n = toNumber(value);
  return n === undefined ? undefined : Math.round(n * MAN);
}

function bool(value: YesNo): boolean | undefined {
  return value === 'yes' ? true : value === 'no' ? false : undefined;
}

/** undefined 값의 키를 지웁니다(exactOptionalPropertyTypes: "모름"은 키 없음). */
function compact<T extends object>(obj: { [K in keyof T]: T[K] | undefined }): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function region(home: HomeAnswers, withRegulated: boolean) {
  return compact<{ metro: boolean; regulated: boolean; ruralTownship: boolean }>({
    metro: home.region === 'metro' ? true : home.region === 'local' ? false : undefined,
    regulated: withRegulated && home.region === 'local' ? bool(home.regulated) : undefined,
    ruralTownship: asksRuralTownship(home) ? bool(home.ruralTownship) : undefined,
  });
}

/** 위저드 답 → 엔진 입력. 고르지 않은 항목과 '모름'은 입력하지 않은 것으로 넘깁니다. */
export function toProfile(a: Answers): UserProfile {
  const childCount = a.children === null || a.children === 'unknown' ? 0 : Number(a.children);
  const purchase = wantsPurchase(a)
    ? compact({
        region: region(a.purchase, true),
        price: won(a.purchase.amount),
        areaM2: toNumber(a.purchase.area),
        contractSigned: bool(a.purchase.contract),
      })
    : undefined;
  const jeonse = wantsJeonse(a)
    ? compact({
        region: region(a.jeonse, false),
        deposit: won(a.jeonse.amount),
        areaM2: toNumber(a.jeonse.area),
        contractSigned: bool(a.jeonse.contract),
      })
    : undefined;

  return compact<UserProfile>({
    applicant: compact({ annualIncome: won(a.applicantIncome) }),
    spouse: compact({ annualIncome: won(a.spouseIncome) }),
    marriage: compact({
      status: a.marriageStatus ?? 'married',
      date: a.marriageDate || undefined,
    }),
    netAssets: won(a.netAssets),
    household: compact({
      allHomeless: bool(a.allHomeless),
      everOwnedHome: bool(a.everOwnedHome),
      everHadFundPurchaseLoan: bool(a.everHadFundPurchaseLoan),
      hasFundLoan: bool(a.hasFundLoan),
      hasMortgageLoan: bool(a.hasMortgageLoan),
      hasJeonseLoan: bool(a.hasJeonseLoan),
      livesInPublicRental: bool(a.livesInPublicRental),
    }),
    // 자녀는 금리 우대에만 쓰이며 출생일은 판정에 쓰지 않습니다.
    children: Array.from({ length: childCount }, () => ({ birthDate: '2020-01-01' })),
    purchase,
    jeonse,
  });
}

/**
 * 결과의 조건(최상위 checks 한 줄)을 어느 질문 단계에서 고칠 수 있는지.
 * 규칙 JSON의 최상위 조건 id와 맞춰야 합니다(test/wizard.test.ts가 확인).
 */
const CONDITION_STEP: Record<string, StepId> = {
  allHomeless: 'history',
  noDuplicateLoan: 'history',
  firstHome: 'history',
  noPublicRental: 'history',
  income: 'income',
  netAssets: 'assets',
  newlywed: 'marriage',
  deposit: 'jeonseHome',
};

export function stepForCondition(ruleId: string, conditionId: string): StepId | undefined {
  if (conditionId === 'area' || conditionId === 'price') {
    return ruleId === 'loan-newlywed-jeonse' ? 'jeonseHome' : 'purchaseHome';
  }
  return CONDITION_STEP[conditionId];
}

/** 결과에 보여 줄 규칙 id */
export function ruleIdsFor(a: Answers): string[] {
  const ids: string[] = [];
  if (wantsPurchase(a)) ids.push('loan-newlywed-purchase');
  if (wantsJeonse(a)) ids.push('loan-newlywed-jeonse');
  return ids;
}
