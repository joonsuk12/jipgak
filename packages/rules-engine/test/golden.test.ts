/**
 * docs/golden-cases.md를 그대로 옮긴 테스트입니다. 기대값을 바꾸려면 문서부터 고칩니다.
 * 금액은 문서와 같이 만 원 단위로 적고 man()으로 원 단위로 바꿉니다.
 */
import { products } from '@jipgak/rules-data';
import { describe, expect, it } from 'vitest';
import { computeRate, createContext, evaluate } from '../src';
import type { Region, Rule, Status, UserProfile } from '../src';

const asOf = '2026-11-17';
const man = (v: number): number => v * 10_000;

const rules = products as Rule[];
const ruleOf = (id: string): Rule => {
  const rule = rules.find((r) => r.id === id);
  if (!rule) throw new Error(`규칙 없음: ${id}`);
  return rule;
};
const purchaseRule = ruleOf('loan-newlywed-purchase');
const jeonseRule = ruleOf('loan-newlywed-jeonse');

const METRO: Region = { metro: true };
const LOCAL: Region = { metro: false, regulated: false };

/**
 * 공통 기본값: 세대원 전원 무주택, 주택 보유 이력 없음, 기금 구입·중도금 대출 이력 없음, 기금대출·주담대·전세대출 미이용, 공공임대 미거주.
 * 매매·임대차 계약 체결. 계약 여부는 상태에 영향을 주지 않습니다(D-15).
 */
function base(): UserProfile {
  return {
    applicant: { annualIncome: man(3_500) },
    spouse: { annualIncome: man(2_500) },
    marriage: { status: 'married', date: '2023-05-01' },
    netAssets: man(30_000),
    household: {
      allHomeless: true,
      everOwnedHome: false,
      everHadFundPurchaseLoan: false,
      hasFundLoan: false,
      hasMortgageLoan: false,
      hasJeonseLoan: false,
      livesInPublicRental: false,
    },
    purchase: {
      region: { metro: true, zone: 'seoul' },
      price: man(50_000),
      areaM2: 84,
      contractSigned: true,
    },
    jeonse: { region: METRO, deposit: man(30_000), areaM2: 59, contractSigned: true },
  };
}

function withIncome(p: UserProfile, applicant: number, spouse: number): UserProfile {
  return {
    ...p,
    applicant: { annualIncome: man(applicant) },
    spouse: { annualIncome: man(spouse) },
  };
}

/** 순자산 "모름" */
function withoutNetAssets(p: UserProfile): UserProfile {
  const { netAssets: _omit, ...rest } = p;
  return rest;
}

/** 기금대출 이용 여부 "모름" */
function withoutFundLoanAnswer(p: UserProfile): UserProfile {
  const { hasFundLoan: _omit, ...household } = p.household;
  return { ...p, household };
}

/** 임대차계약 체결 여부 "모름" */
function withoutJeonseContractAnswer(p: UserProfile): UserProfile {
  const { contractSigned: _omit, ...jeonse } = p.jeonse!;
  return { ...p, jeonse };
}

interface Case {
  id: string;
  profile: UserProfile;
  status: Status;
  limit?: number; // 만 원
  note?: string;
}

const p01 = base();

const purchaseCases: Case[] = [
  { id: 'P01', profile: p01, status: 'eligible', limit: 29_500 },
  {
    id: 'P02',
    profile: withIncome(p01, 5_500, 3_500),
    status: 'eligible',
    limit: 29_500,
    note: '1인 소득 기준 적용, 금리 +0.3%p',
  },
  { id: 'P03', profile: withIncome(p01, 6_500, 2_500), status: 'ineligible' },
  { id: 'P04', profile: { ...p01, netAssets: man(52_000) }, status: 'ineligible' },
  {
    id: 'P05',
    profile: { ...p01, marriage: { status: 'planned', date: '2027-01-20' } },
    status: 'eligible',
    limit: 29_500,
  },
  {
    id: 'P06',
    profile: { ...p01, marriage: { status: 'planned', date: '2027-04-30' } },
    status: 'ineligible',
  },
  {
    id: 'P07',
    profile: { ...p01, marriage: { status: 'married', date: '2018-03-01' } },
    status: 'ineligible',
  },
  {
    id: 'P08',
    profile: { ...p01, purchase: { ...p01.purchase!, price: man(65_000) } },
    status: 'ineligible',
  },
  {
    id: 'P09',
    profile: {
      ...withIncome(p01, 1_800, 1_200),
      purchase: {
        region: { ...LOCAL, zone: 'other' },
        price: man(30_000),
        areaM2: 84,
        contractSigned: true,
      },
    },
    status: 'eligible',
    limit: 21_500,
  },
  {
    id: 'P10',
    profile: { ...p01, household: { ...p01.household, everOwnedHome: true } },
    status: 'ineligible',
  },
  {
    id: 'P11',
    profile: withoutNetAssets(p01),
    status: 'needs_check',
    limit: 29_500,
  },
  {
    id: 'P12',
    profile: { ...p01, purchase: { ...p01.purchase!, areaM2: 99 } },
    status: 'ineligible',
  },
  {
    id: 'P13',
    profile: { ...p01, purchase: { ...p01.purchase!, contractSigned: false } },
    status: 'eligible',
    limit: 29_500,
    note: '주택매매계약을 체결해야 신청할 수 있습니다. 계약 전이라면 계약 후 수탁은행에 신청하세요.',
  },
  {
    id: 'P14',
    profile: { ...p01, household: { ...p01.household, everHadFundPurchaseLoan: true } },
    status: 'ineligible',
  },
  {
    id: 'P15',
    profile: {
      ...withIncome(p01, 1_800, 1_200),
      purchase: {
        region: { metro: false, zone: 'other' },
        price: man(30_000),
        areaM2: 84,
        contractSigned: true,
      },
    },
    status: 'eligible',
    limit: 21_500,
    note: '규제지역 여부를 몰라 LTV 80%로 계산했습니다. 규제지역이면 LTV 70%가 적용되어 예상 한도가 줄어듭니다.',
  },
  {
    id: 'P16',
    profile: { ...p01, purchase: { ...p01.purchase!, region: {} } },
    status: 'eligible',
  },
  {
    id: 'P17',
    profile: {
      ...p01,
      purchase: { ...p01.purchase!, region: { metro: true, zone: 'gyeonggi-2800' } },
    },
    status: 'eligible',
    limit: 32_000,
  },
  {
    id: 'P18',
    profile: {
      ...p01,
      purchase: { ...p01.purchase!, region: { metro: true }, price: man(40_000) },
    },
    status: 'eligible',
    limit: 22_500,
    note: '세부 지역(시·군)을 몰라 소액임차보증금을 가장 큰 금액(5,500만 원)으로 빼고 계산했습니다. 지역을 고르면 한도가 정확해집니다.',
  },
];

const j01 = base();

const jeonseCases: Case[] = [
  { id: 'J01', profile: j01, status: 'eligible', limit: 24_000 },
  {
    id: 'J02',
    profile: { ...j01, jeonse: { ...j01.jeonse!, deposit: man(35_000) } },
    status: 'eligible',
    limit: 25_000,
  },
  {
    id: 'J03',
    profile: { ...j01, jeonse: { ...j01.jeonse!, region: LOCAL, deposit: man(25_000) } },
    status: 'eligible',
    limit: 16_000,
  },
  {
    id: 'J04',
    profile: withIncome(j01, 4_500, 4_500),
    status: 'eligible',
    limit: 24_000,
    note: '1인 소득 기준 적용, 금리 +0.3%p (최초 신규 시)',
  },
  { id: 'J05', profile: withIncome(j01, 5_500, 3_500), status: 'ineligible' },
  { id: 'J06', profile: { ...j01, netAssets: man(40_000) }, status: 'ineligible' },
  {
    id: 'J07',
    profile: { ...j01, jeonse: { ...j01.jeonse!, deposit: man(45_000) } },
    status: 'ineligible',
  },
  {
    id: 'J08',
    profile: { ...j01, household: { ...j01.household, livesInPublicRental: true } },
    status: 'ineligible',
  },
  {
    id: 'J09',
    profile: {
      ...withIncome(j01, 3_000, 2_000),
      marriage: { status: 'planned', date: '2027-01-20' },
    },
    status: 'eligible',
    limit: 24_000,
  },
  {
    id: 'J10',
    profile: withoutFundLoanAnswer(j01),
    status: 'needs_check',
    limit: 24_000,
  },
  {
    id: 'J11',
    profile: withoutJeonseContractAnswer(j01),
    status: 'eligible',
    limit: 24_000,
    note: '임대차계약을 체결하고 보증금의 5% 이상을 지불해야 신청할 수 있습니다. 계약 전이라면 계약 후 수탁은행에 신청하세요.',
  },
  {
    id: 'J12',
    profile: { ...j01, jeonse: { ...j01.jeonse!, region: {}, deposit: man(35_000) } },
    status: 'needs_check',
  },
  {
    id: 'J13',
    profile: { ...j01, jeonse: { ...j01.jeonse!, region: {} } },
    status: 'eligible',
  },
];

function runCases(rule: Rule, cases: Case[]): void {
  it.each(cases)('$id → $status', ({ profile, status, limit, note }) => {
    const result = evaluate(rule, profile, { asOf });
    expect(result.status).toBe(status);
    expect(result.estimatedLimit).toBe(limit === undefined ? undefined : man(limit));
    // 골든 케이스가 명시한 안내(1인 소득 기준, 계약 전, 규제지역 모름)만 붙어야 합니다.
    const flagged = result.notes.filter(
      (n) =>
        n.startsWith('1인 소득') ||
        n.includes('계약 전이라면') ||
        n.includes('규제지역 여부를 몰라') ||
        n.includes('세부 지역(시·군)을 몰라'),
    );
    expect(flagged).toEqual(note ? [note] : []);
  });
}

describe('골든: 구입자금 (loan-newlywed-purchase)', () => {
  runCases(purchaseRule, purchaseCases);

  it('P09 10년 기본금리 2.90 − 0.2 = 2.70%', () => {
    const profile = purchaseCases.find((c) => c.id === 'P09')!.profile;
    const quote = computeRate(
      purchaseRule.rate!,
      createContext(purchaseRule, profile, { asOf }),
      10,
    );
    expect(quote?.baseRate).toBe(2.7);
  });
});

describe('골든: 전세자금 (loan-newlywed-jeonse)', () => {
  runCases(jeonseRule, jeonseCases);
});

describe('골든: 구입자금 기본금리 (우대 전)', () => {
  const rateCases = [
    { id: 'R01', applicant: 1_000, spouse: 800, term: 30, region: METRO, rate: 2.8 },
    { id: 'R02', applicant: 2_500, spouse: 1_500, term: 10, region: METRO, rate: 2.9 },
    { id: 'R03', applicant: 4_000, spouse: 3_200, term: 20, region: LOCAL, rate: 3.6 },
    { id: 'R04', applicant: 5_500, spouse: 3_500, term: 30, region: METRO, rate: 4.15 },
  ];
  it.each(rateCases)('$id → $rate%', ({ applicant, spouse, term, region, rate }) => {
    const profile: UserProfile = {
      ...withIncome(base(), applicant, spouse),
      purchase: { region, price: man(30_000), areaM2: 84, contractSigned: true },
    };
    const ctx = createContext(purchaseRule, profile, { asOf });
    expect(computeRate(purchaseRule.rate!, ctx, term)?.baseRate).toBe(rate);
  });
});
