import { products } from '@jipgak/rules-data';
import { evaluate, type Rule } from '@jipgak/rules-engine';
import { describe, expect, it } from 'vitest';
import { BASE_FORM, PRESETS, toProfile } from '../src/screens/playground/form';

const [purchase, jeonse] = ['loan-newlywed-purchase', 'loan-newlywed-jeonse'].map((id) =>
  (products as Rule[]).find((r) => r.id === id)!,
) as [Rule, Rule];

function run(id: string) {
  const preset = PRESETS.find((p) => p.id === id)!;
  const form = { ...BASE_FORM, ...preset.patch };
  const profile = toProfile(form);
  return {
    purchase: evaluate(purchase, profile, { asOf: form.asOf }),
    jeonse: evaluate(jeonse, profile, { asOf: form.asOf }),
  };
}

describe('테스트 화면 프리셋 = 골든 케이스', () => {
  it.each([
    ['P01', 'eligible', 32_000, 'eligible', 24_000],
    ['P02', 'eligible', 32_000, 'ineligible', undefined],
    ['P03', 'ineligible', undefined, 'ineligible', undefined],
    ['P05', 'eligible', 32_000, 'eligible', 24_000],
    ['P06', 'ineligible', undefined, 'ineligible', undefined],
    ['P09', 'eligible', 24_000, 'eligible', 16_000],
    ['P11', 'needs_check', 32_000, 'needs_check', 24_000],
    ['J10', 'needs_check', 32_000, 'needs_check', 24_000],
    ['C1', 'needs_check', 32_000, 'needs_check', 24_000],
  ] as const)('%s', (id, pStatus, pLimit, jStatus, jLimit) => {
    const r = run(id);
    expect(r.purchase.status).toBe(pStatus);
    expect(r.purchase.estimatedLimit).toBe(pLimit && pLimit * 10_000);
    expect(r.jeonse.status).toBe(jStatus);
    expect(r.jeonse.estimatedLimit).toBe(jLimit && jLimit * 10_000);
  });
});
