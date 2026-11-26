import { products } from '@jipgak/rules-data';
import { describe, expect, it } from 'vitest';
import {
  evaluateNode,
  FACT_KEYS,
  fullYearsBetween,
  parseDuration,
  shiftDate,
  evaluate,
  collectTiming,
} from '../src';
import type { ConditionNode, Facts, Rule } from '../src';

function collectFacts(value: unknown, out: Set<string>): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectFacts(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'fact' || k === 'of' || k === 'rowFact') && typeof v === 'string') out.add(v);
      collectFacts(v, out);
    }
  }
  return out;
}

describe('규칙 데이터 ↔ 엔진', () => {
  it.each(products as Rule[])('$id 는 엔진이 아는 fact만 쓴다', (rule) => {
    const known = new Set<string>(FACT_KEYS);
    expect([...collectFacts(rule, new Set())].filter((f) => !known.has(f))).toEqual([]);
  });
});

describe('dates', () => {
  it('월 단위 이동과 말일 보정', () => {
    expect(shiftDate('2026-11-17', parseDuration('P3M'), 1)).toBe('2027-02-17');
    expect(shiftDate('2027-04-30', parseDuration('P3M'), -1)).toBe('2027-01-30');
    expect(shiftDate('2026-11-30', parseDuration('P3M'), 1)).toBe('2027-02-28');
    expect(shiftDate('2026-11-17', parseDuration('P7Y'), -1)).toBe('2019-11-17');
  });
  it('만 햇수', () => {
    expect(fullYearsBetween('2020-11-18', '2026-11-17')).toBe(5);
    expect(fullYearsBetween('2020-11-17', '2026-11-17')).toBe(6);
  });
});

describe('3값 논리', () => {
  const facts: Facts = { 'assets.net': null, 'children.count': 1 };
  const ctx = { facts, asOf: '2026-11-17', definitions: {}, lookups: {} };
  const unknown: ConditionNode = { id: 'a', label: 'a', fact: 'assets.net', op: '<=', value: 1 };
  const yes: ConditionNode = { id: 'b', label: 'b', fact: 'children.count', op: '==', value: 1 };
  const no: ConditionNode = { id: 'c', label: 'c', fact: 'children.count', op: '>', value: 1 };

  it('all/any', () => {
    expect(evaluateNode({ all: [yes, unknown] }, ctx)).toBe(null);
    expect(evaluateNode({ all: [no, unknown] }, ctx)).toBe(false);
    expect(evaluateNode({ any: [yes, unknown] }, ctx)).toBe(true);
    expect(evaluateNode({ any: [no, unknown] }, ctx)).toBe(null);
  });
  it('모르는 fact와 ref는 오류', () => {
    expect(() =>
      evaluateNode({ id: 'x', label: 'x', fact: 'nope', op: '==', value: 1 }, ctx),
    ).toThrow();
    expect(() => evaluateNode({ ref: 'missing' }, ctx)).toThrow();
  });
});

describe('안내 문구', () => {
  it('불가 결과에는 신청 안내를 붙이지 않는다', () => {
    const rule = (products as Rule[]).find((r) => r.id === 'loan-newlywed-purchase')!;
    const result = evaluate(
      rule,
      {
        applicant: { annualIncome: 65_000_000 },
        spouse: { annualIncome: 25_000_000 },
        marriage: { status: 'married', date: '2023-05-01' },
        netAssets: 300_000_000,
        household: {},
        purchase: {
          region: { metro: true },
          price: 500_000_000,
          areaM2: 84,
          contractSigned: false,
        },
      },
      { asOf: '2026-11-17' },
    );
    expect(result.status).toBe('ineligible');
    expect(result.notes).toEqual([]);
  });
});

describe('접수일 날짜 안내', () => {
  it('같은 정의를 두 곳에서 참조해도 안내는 한 번만 낸다', () => {
    const newlywed: ConditionNode = {
      all: [
        { id: 'married', label: '기혼', fact: 'marriage.status', op: '==', value: 'married' },
        {
          id: 'within7',
          label: '혼인 7년 이내',
          fact: 'marriage.date',
          op: 'withinPast',
          value: 'P7Y',
        },
      ],
    };
    const facts = {
      'marriage.status': 'married',
      'marriage.date': '2019-12-01',
    } as unknown as Facts;
    const notes = collectTiming(
      { all: [{ ref: 'newlywed' }, { any: [{ ref: 'newlywed' }] }] },
      { facts, asOf: '2026-11-17', definitions: { newlywed }, lookups: {} },
      'P3M',
    );
    expect(notes).toEqual([
      { kind: 'expires', conditionId: 'within7', label: '혼인 7년 이내', date: '2026-12-01' },
    ]);
  });
});
