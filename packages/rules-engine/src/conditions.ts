import { parseDuration, shiftDate } from './dates';
import { isFactKey } from './facts';
import type { Condition, ConditionNode, FactValue, Facts, Truth } from './types';

/** 조건 평가에 필요한 문맥 */
export interface EvalContext {
  facts: Facts;
  asOf: string;
  definitions: Readonly<Record<string, ConditionNode>>;
}

const MAX_REF_DEPTH = 16;

export function isCondition(node: ConditionNode): node is Condition {
  return 'fact' in node;
}

export function readFact(ctx: EvalContext, key: string): FactValue {
  if (!isFactKey(key)) throw new Error(`알 수 없는 fact: ${key}`);
  return ctx.facts[key] ?? null;
}

function compare(actual: FactValue, cond: Condition, ctx: EvalContext): Truth {
  if (actual === null) return null;

  if (cond.op === 'withinPast' || cond.op === 'withinNext') {
    if (typeof actual !== 'string') {
      throw new Error(`${cond.id}: 날짜 연산은 날짜 fact에만 쓸 수 있습니다 (${cond.fact})`);
    }
    const duration = parseDuration(cond.value);
    if (cond.op === 'withinPast') {
      const from = shiftDate(ctx.asOf, duration, -1);
      return from <= actual && actual <= ctx.asOf;
    }
    const to = shiftDate(ctx.asOf, duration, 1);
    return ctx.asOf <= actual && actual <= to;
  }

  const expected = cond.value;
  if (typeof actual !== typeof expected) {
    throw new Error(
      `${cond.id}: fact ${cond.fact}(${typeof actual})와 기준값(${typeof expected})의 타입이 다릅니다`,
    );
  }
  if (cond.op === '==') return actual === expected;
  if (cond.op === '!=') return actual !== expected;
  if (typeof actual === 'boolean' || typeof expected === 'boolean') {
    throw new Error(`${cond.id}: 참/거짓 값에는 ==, != 만 쓸 수 있습니다`);
  }
  // 문자열은 'YYYY-MM-DD' 날짜 비교에 씁니다(사전순 = 날짜순).
  const [a, b] = [actual, expected] as [number, number] | [string, string];
  switch (cond.op) {
    case '<=':
      return a <= b;
    case '<':
      return a < b;
    case '>=':
      return a >= b;
    case '>':
      return a > b;
  }
}

/** 3값 논리(Kleene) AND: false가 있으면 false, 없고 null이 있으면 null */
function and(values: Truth[]): Truth {
  if (values.includes(false)) return false;
  if (values.includes(null)) return null;
  return true;
}

/** 3값 논리(Kleene) OR: true가 있으면 true, 없고 null이 있으면 null */
function or(values: Truth[]): Truth {
  if (values.includes(true)) return true;
  if (values.includes(null)) return null;
  return false;
}

export function evaluateNode(node: ConditionNode, ctx: EvalContext, depth = 0): Truth {
  if (depth > MAX_REF_DEPTH) throw new Error('조건 참조(ref)가 너무 깊거나 순환합니다');
  if (isCondition(node)) return compare(readFact(ctx, node.fact), node, ctx);
  if ('all' in node) return and(node.all.map((child) => evaluateNode(child, ctx, depth + 1)));
  if ('any' in node) return or(node.any.map((child) => evaluateNode(child, ctx, depth + 1)));
  const target = ctx.definitions[node.ref];
  if (!target) throw new Error(`정의되지 않은 조건 참조: ${node.ref}`);
  return evaluateNode(target, ctx, depth + 1);
}

/** when 조건이 확실히 true일 때만 true. 없으면 true */
export function holds(node: ConditionNode | undefined, ctx: EvalContext): boolean {
  return node === undefined || evaluateNode(node, ctx) === true;
}
