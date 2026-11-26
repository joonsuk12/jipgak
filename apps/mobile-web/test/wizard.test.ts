import { products } from '@jipgak/rules-data';
import { evaluate, type Rule } from '@jipgak/rules-engine';
import { describe, expect, it } from 'vitest';
import { decimalOnly, formatManWon, m2ToPyeong, pyeongToM2, todayISO } from '../src/format';
import { describePyeongType } from '../src/screens/wizard/areaTypes';
import { HOUSEHOLD_AREA } from '../src/screens/wizard/householdArea';
import { ALL_ZONE_IDS } from '../src/screens/wizard/zones';
import {
  type Answers,
  emptyAnswers,
  ruleIdsFor,
  stepForCondition,
  toProfile,
  visibleSteps,
} from '../src/screens/wizard/answers';

const asOf = '2026-11-17';
const rule = (id: string) => (products as Rule[]).find((r) => r.id === id)!;

/** 골든 P01·J01과 같은 답 */
function p01(): Answers {
  const a = emptyAnswers();
  return {
    ...a,
    purpose: 'both',
    marriageStatus: 'married',
    marriageDate: '2023-05-01',
    children: '0',
    applicantIncome: '3500',
    spouseIncome: '2500',
    netAssets: '30000',
    allHomeless: 'yes',
    everOwnedHome: 'no',
    everHadFundPurchaseLoan: 'no',
    hasFundLoan: 'no',
    hasMortgageLoan: 'no',
    hasJeonseLoan: 'no',
    livesInPublicRental: 'no',
    purchase: {
      ...a.purchase,
      region: 'metro',
      sido: 'seoul',
      zone: 'seoul',
      amount: '50000',
      area: '84',
      contract: 'yes',
    },
    jeonse: { ...a.jeonse, region: 'metro', amount: '30000', area: '59', contract: 'yes' },
  };
}

function run(a: Answers) {
  const profile = toProfile(a);
  return {
    purchase: evaluate(rule('loan-newlywed-purchase'), profile, { asOf }),
    jeonse: evaluate(rule('loan-newlywed-jeonse'), profile, { asOf }),
  };
}

describe('위저드 답 → 엔진 입력', () => {
  it('골든 P01·J01과 같은 결과', () => {
    const r = run(p01());
    expect(r.purchase.status).toBe('eligible');
    expect(r.purchase.estimatedLimit).toBe(295_000_000);
    expect(r.jeonse.status).toBe('eligible');
    expect(r.jeonse.estimatedLimit).toBe(240_000_000);
  });

  it('아무것도 고르지 않으면 불가가 아니라 확인 필요', () => {
    const r = run({ ...emptyAnswers(), purpose: 'both' });
    expect(r.purchase.status).toBe('needs_check');
    expect(r.jeonse.status).toBe('needs_check');
  });

  it("'모름'은 입력하지 않은 것과 같다", () => {
    const r = run({ ...p01(), netAssets: null, hasFundLoan: 'unknown' });
    expect(r.purchase.status).toBe('needs_check');
  });

  it('지역 모름: 지역에 따라 갈리는 보증금이면 확인 필요, 아니면 가능(한도는 없음)', () => {
    const a = p01();
    const over = run({ ...a, jeonse: { ...a.jeonse, region: 'unknown', amount: '35000' } });
    expect(over.jeonse.status).toBe('needs_check');
    const under = run({ ...a, jeonse: { ...a.jeonse, region: 'unknown' } });
    expect(under.jeonse.status).toBe('eligible');
    expect(under.jeonse.estimatedLimit).toBeUndefined();
  });

  it('소수점 면적 84.97㎡는 85㎡ 이하로 판정 (리뷰 지적 1)', () => {
    const a = p01();
    const r = run({ ...a, purchase: { ...a.purchase, area: '84.97' } });
    expect(toProfile({ ...a, purchase: { ...a.purchase, area: '84.97' } }).purchase?.areaM2).toBe(
      84.97,
    );
    expect(r.purchase.status).toBe('eligible');
  });

  it('수도권이면 규제지역 답은 무시', () => {
    const a = p01();
    const profile = toProfile({ ...a, purchase: { ...a.purchase, regulated: 'yes' } });
    expect(profile.purchase?.region).toEqual({ metro: true, zone: 'seoul' });
  });

  it('읍·면 답은 수도권 외 85㎡ 초과일 때만 쓴다', () => {
    const a = p01();
    const local = {
      ...a.purchase,
      region: 'local' as const,
      zone: 'other' as const,
      ruralTownship: 'yes' as const,
    };
    expect(toProfile({ ...a, purchase: { ...local, area: '84' } }).purchase?.region).toEqual({
      metro: false,
      zone: 'other',
    });
    expect(toProfile({ ...a, purchase: { ...local, area: '95' } }).purchase?.region).toEqual({
      metro: false,
      ruralTownship: true,
      zone: 'other',
    });
  });

  it('목적에 맞는 단계와 상품만', () => {
    const a = { ...emptyAnswers(), purpose: 'jeonse' as const };
    expect(visibleSteps(a)).not.toContain('purchaseHome');
    expect(visibleSteps(a)).toContain('jeonseHome');
    expect(ruleIdsFor(a)).toEqual(['loan-newlywed-jeonse']);
    expect(toProfile(a).purchase).toBeUndefined();
  });
});

describe('조건 → 질문 단계', () => {
  it.each(products as Rule[])('$id 의 모든 조건을 고칠 단계가 있다', (r) => {
    const root = r.conditions as { all?: { id?: string }[] };
    const ids = (root.all ?? []).map((c) => c.id ?? '');
    for (const id of ids) {
      expect({ id, step: stepForCondition(r.id, id) }).not.toEqual({ id, step: undefined });
    }
  });
  it('면적은 상품에 맞는 집 단계로', () => {
    expect(stepForCondition('loan-newlywed-purchase', 'area')).toBe('purchaseHome');
    expect(stepForCondition('loan-newlywed-jeonse', 'area')).toBe('jeonseHome');
  });
});

describe('세부 지역 코드', () => {
  it('화면의 지역 코드와 규칙의 소액임차보증금 표가 같다', () => {
    const table = rule('loan-newlywed-purchase').lookups?.smallTenantDeposit?.values ?? {};
    expect([...ALL_ZONE_IDS].sort()).toEqual(Object.keys(table).sort());
  });
  it('지역 코드가 엔진 입력으로 간다', () => {
    const a = p01();
    expect(
      toProfile({ ...a, purchase: { ...a.purchase, zone: 'gyeonggi-2800' } }).purchase?.region,
    ).toEqual({
      metro: true,
      zone: 'gyeonggi-2800',
    });
  });
});

describe('format', () => {
  it('만 원 → 한국어 금액', () => {
    expect(formatManWon(3500)).toBe('3,500만 원');
    expect(formatManWon(50000)).toBe('5억 원');
    expect(formatManWon(35000)).toBe('3억 5,000만 원');
    expect(formatManWon(0)).toBe('0만 원');
  });
  it('가구원 수별 평균 면적은 docs/sources/household-area.md 값과 같다', () => {
    expect(HOUSEHOLD_AREA.map((h) => [h.members, h.m2, m2ToPyeong(h.m2)])).toEqual([
      ['1인', 44.0, 13.3],
      ['2인', 65.6, 19.8],
      ['3인', 74.8, 22.6],
      ['4인', 79.7, 24.1],
      ['5인 이상', 87.1, 26.3],
    ]);
  });
  it('전용면적 → 흔한 평형 표현 (세 기준점 59·74·84㎡ 사이만)', () => {
    expect(describePyeongType(84)).toBe('흔히 34평형 안팎');
    expect(describePyeongType(84.97)).toBe('흔히 34평형 안팎');
    expect(describePyeongType(59)).toBe('흔히 25평형 안팎');
    expect(describePyeongType(65.6)).toBe('25~30평형 사이');
    expect(describePyeongType(79.7)).toBe('30~34평형 사이');
    expect(describePyeongType(44)).toBe('25평형보다 작아요');
    expect(describePyeongType(99)).toBe('34평형보다 커요');
  });
  it('평 ↔ ㎡ (1평 = 400/121㎡)', () => {
    expect(pyeongToM2(1)).toBe(3.31);
    expect(pyeongToM2(25.5)).toBe(84.3);
    expect(m2ToPyeong(84)).toBe(25.4);
    expect(m2ToPyeong(59)).toBe(17.8);
  });
  it('면적 입력은 소수점 하나, 둘째 자리까지', () => {
    expect(decimalOnly('84.97㎡')).toBe('84.97');
    expect(decimalOnly('84.975')).toBe('84.97');
    expect(decimalOnly('8.4.9')).toBe('8.49');
    expect(decimalOnly('59')).toBe('59');
  });
  it('오늘 날짜', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
