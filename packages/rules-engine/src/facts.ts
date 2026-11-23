import { assertISODate, fullYearsBetween, isISODate } from './dates';
import type { EvalOptions, FactValue, Facts, UserProfile } from './types';

/**
 * 규칙이 참조할 수 있는 fact 키 전체. 규칙에서 여기 없는 키를 쓰면 평가 시 오류가 납니다.
 * 값이 null이면 "입력 모름" 또는 "해당 없음"입니다.
 */
export const FACT_KEYS = [
  'marriage.status',
  'marriage.date',
  'applicant.income',
  'spouse.income',
  'income.combined',
  'assets.net',
  'household.allHomeless',
  'household.everOwnedHome',
  'household.everHadFundPurchaseLoan',
  'household.hasFundLoan',
  'household.hasMortgageLoan',
  'household.hasJeonseLoan',
  'household.livesInPublicRental',
  'children.count',
  'subscription.years',
  'subscription.paymentCount',
  'purchase.metro',
  'purchase.regulated',
  'purchase.ruralTownship',
  'purchase.price',
  'purchase.areaM2',
  'purchase.contractSigned',
  'purchase.contractDate',
  'jeonse.metro',
  'jeonse.ruralTownship',
  'jeonse.deposit',
  'jeonse.areaM2',
  'jeonse.contractSigned',
  'jeonse.contractDate',
] as const;

export type FactKey = (typeof FACT_KEYS)[number];

const FACT_KEY_SET: ReadonlySet<string> = new Set(FACT_KEYS);

export function isFactKey(key: string): key is FactKey {
  return FACT_KEY_SET.has(key);
}

function opt<T extends FactValue>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

function date(value: string | undefined): string | null {
  return isISODate(value) ? value : null;
}

/** 사용자 입력 → 판정용 파생값. asOf 기준으로 날짜 관련 값을 계산합니다. */
export function computeFacts(profile: UserProfile, { asOf }: EvalOptions): Facts {
  assertISODate(asOf, 'asOf');

  const applicantIncome = opt(profile.applicant.annualIncome);
  const spouseIncome = opt(profile.spouse?.annualIncome);
  const combined =
    applicantIncome !== null && spouseIncome !== null ? applicantIncome + spouseIncome : null;

  const sub = profile.subscription;
  const subYears = sub && isISODate(sub.joinedAt) ? fullYearsBetween(sub.joinedAt, asOf) : null;

  const { household, purchase, jeonse } = profile;

  const facts: Record<FactKey, FactValue> = {
    'marriage.status': profile.marriage.status,
    'marriage.date': date(profile.marriage.date),
    'applicant.income': applicantIncome,
    'spouse.income': spouseIncome,
    'income.combined': combined,
    'assets.net': opt(profile.netAssets),
    'household.allHomeless': opt(household.allHomeless),
    'household.everOwnedHome': opt(household.everOwnedHome),
    'household.everHadFundPurchaseLoan': opt(household.everHadFundPurchaseLoan),
    'household.hasFundLoan': opt(household.hasFundLoan),
    'household.hasMortgageLoan': opt(household.hasMortgageLoan),
    'household.hasJeonseLoan': opt(household.hasJeonseLoan),
    'household.livesInPublicRental': opt(household.livesInPublicRental),
    'children.count': profile.children?.length ?? 0,
    'subscription.years': subYears,
    'subscription.paymentCount': sub ? sub.paymentCount : null,
    'purchase.metro': purchase ? purchase.region.metro : null,
    'purchase.regulated': opt(purchase?.region.regulated),
    'purchase.ruralTownship': opt(purchase?.region.ruralTownship),
    'purchase.price': opt(purchase?.price),
    'purchase.areaM2': opt(purchase?.areaM2),
    'purchase.contractSigned': opt(purchase?.contractSigned),
    'purchase.contractDate': date(purchase?.contractDate),
    'jeonse.metro': jeonse ? jeonse.region.metro : null,
    'jeonse.ruralTownship': opt(jeonse?.region.ruralTownship),
    'jeonse.deposit': opt(jeonse?.deposit),
    'jeonse.areaM2': opt(jeonse?.areaM2),
    'jeonse.contractSigned': opt(jeonse?.contractSigned),
    'jeonse.contractDate': date(jeonse?.contractDate),
  };
  return facts;
}
