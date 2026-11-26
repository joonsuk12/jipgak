import { type EvalContext, holds, readFact } from './conditions';
import type { DtiEstimate, DtiSpec, LimitSpec, RateQuote, RateSpec, Won } from './types';

/** 금액표에서 fact 값(코드)에 맞는 금액. 모르면 표의 최댓값, 표에 없는 코드는 규칙 오류 */
export function lookupAmount(name: string, ctx: EvalContext): Won {
  const table = ctx.lookups[name];
  if (!table) throw new Error(`정의되지 않은 금액표: ${name}`);
  const key = readFact(ctx, table.fact);
  if (key === null) return Math.max(...Object.values(table.values));
  if (typeof key !== 'string' || !(key in table.values)) {
    throw new Error(`금액표 ${name}에 없는 코드: ${String(key)}`);
  }
  return table.values[key] ?? 0;
}

/**
 * 예상 한도: cap마다 처음으로 when이 true인 선택지(금액 또는 fact × 비율)를 고르고,
 * 그중 가장 작은 값을 씁니다. 계산할 수 없는 cap이 있으면(입력 모름) undefined입니다.
 */
export function computeLimit(spec: LimitSpec, ctx: EvalContext): Won | undefined {
  let limit: Won | undefined;
  for (const cap of spec.caps) {
    const option = cap.options.find((o) => holds(o.when, ctx));
    if (!option) return undefined;
    let amount: Won;
    if ('amount' in option) {
      amount = option.amount;
    } else {
      const base = readFact(ctx, option.of);
      if (typeof base !== 'number') return undefined;
      // 부동소수 오차(예: 5억 × 0.7)로 1원 모자라지 않도록 보정 후 내림
      amount = Math.floor(base * option.ratio + 1e-6);
      if (option.minus !== undefined)
        amount = Math.max(0, amount - lookupAmount(option.minus, ctx));
    }
    limit = limit === undefined ? amount : Math.min(limit, amount);
  }
  return limit;
}

/** % → 0.01%p 단위 정수 */
const bp = (pct: number): number => Math.round(pct * 100);
const pct = (basisPoints: number): number => basisPoints / 100;

function rowIndex(spec: RateSpec, ctx: EvalContext): number | undefined {
  const { rowFact, rowUpTo } = spec.table;
  if (spec.topRowWhen && holds(spec.topRowWhen, ctx)) return rowUpTo.length - 1;
  const value = readFact(ctx, rowFact);
  if (typeof value !== 'number') return undefined;
  const index = rowUpTo.findIndex((upTo) => value <= upTo);
  return index === -1 ? undefined : index;
}

function columnIndex(spec: RateSpec, ctx: EvalContext, termYears?: number): number | undefined {
  const { columns } = spec.table;
  if (columns.kind === 'term') {
    if (termYears === undefined) return undefined;
    const index = columns.years.indexOf(termYears);
    return index === -1 ? undefined : index;
  }
  const value = readFact(ctx, columns.fact);
  if (typeof value !== 'number') return undefined;
  const index = columns.upTo.findIndex((upTo) => upTo === null || value <= upTo);
  return index === -1 ? undefined : index;
}

/**
 * 예상 금리. 금리표 + 가감(baseRate), 우대 합계(상한 적용), 하한 적용한 최종금리.
 * 열이 대출기간이면 termYears가 필요합니다. 계산할 수 없으면 undefined입니다.
 */
export function computeRate(
  spec: RateSpec,
  ctx: EvalContext,
  termYears?: number,
): RateQuote | undefined {
  const row = rowIndex(spec, ctx);
  const col = columnIndex(spec, ctx, termYears);
  if (row === undefined || col === undefined) return undefined;
  const tableRate = spec.table.rates[row]?.[col];
  if (tableRate === undefined) return undefined;

  let base = bp(tableRate);
  for (const adj of spec.adjustments) {
    if (holds(adj.when, ctx)) base += bp(adj.deltaPp);
  }

  let discount = 0;
  for (const d of spec.discounts) {
    const option = d.options.find((o) => holds(o.when, ctx));
    if (option) discount += bp(option.pp);
  }
  const capOverride = spec.discountCap.overrides.find((o) => holds(o.when, ctx));
  discount = Math.min(discount, bp(capOverride ? capOverride.value : spec.discountCap.default));

  const final = Math.max(bp(spec.floor), base - discount);
  const quote: RateQuote = { baseRate: pct(base), discount: pct(discount), finalRate: pct(final) };
  if (termYears !== undefined) quote.termYears = termYears;
  return quote;
}

/** 최종금리 범위. 열이 대출기간이면 모든 기간의 최소~최대, fact 구간이면 단일값입니다. */
export function computeRateRange(
  spec: RateSpec,
  ctx: EvalContext,
): { min: number; max: number } | undefined {
  const { columns } = spec.table;
  const terms: (number | undefined)[] = columns.kind === 'term' ? columns.years : [undefined];
  const rates = terms
    .map((t) => computeRate(spec, ctx, t)?.finalRate)
    .filter((r): r is number => r !== undefined);
  if (rates.length === 0) return undefined;
  return { min: Math.min(...rates), max: Math.max(...rates) };
}

/** 원리금균등 상환에서 대출 1원당 연간 상환액 */
export function annualPaymentPerWon(ratePct: number, termYears: number): number {
  const r = ratePct / 100 / 12;
  const n = termYears * 12;
  const monthly = r === 0 ? 1 / n : r / (1 - (1 + r) ** -n);
  return monthly * 12;
}

/**
 * DTI 간이 계산: 기존 대출이 없다고 보고, 새 대출의 연간 원리금이 연소득 × maxRatio를 넘지 않는 최대 대출금.
 * 금리는 rate 설정의 termYears 기간 최종금리(우대·하한 반영)를 씁니다. 소득이나 금리를 모르면 undefined.
 */
export function computeDti(
  spec: DtiSpec,
  rate: RateSpec | undefined,
  ctx: EvalContext,
): DtiEstimate | undefined {
  if (!rate) return undefined;
  const single = spec.singleIncomeWhen !== undefined && holds(spec.singleIncomeWhen, ctx);
  const income = readFact(
    ctx,
    single && spec.singleIncomeFact ? spec.singleIncomeFact : spec.incomeFact,
  );
  if (typeof income !== 'number' || income <= 0) return undefined;
  const quote = computeRate(rate, ctx, spec.termYears);
  if (!quote) return undefined;
  const perWon = annualPaymentPerWon(quote.finalRate, spec.termYears);
  return {
    maxLoan: Math.floor((income * spec.maxRatio) / perWon),
    maxRatio: spec.maxRatio,
    termYears: spec.termYears,
    rate: quote.finalRate,
    income,
    singleIncome: single,
  };
}
