import { type EvalContext, evaluateNode, holds, isCondition, readFact } from './conditions';
import { computeFacts } from './facts';
import { computeDti, computeLimit, computeRateRange } from './limit';
import { collectTiming } from './timing';
import type {
  Check,
  ConditionNode,
  EvalOptions,
  Result,
  Rule,
  RuleSet,
  Status,
  Truth,
  UserProfile,
} from './types';

function toCheck(node: ConditionNode, index: number, ctx: EvalContext): Check {
  const passed = evaluateNode(node, ctx);
  const conditionId = node.id ?? `#${index}`;
  if (isCondition(node)) {
    return {
      conditionId,
      label: node.label,
      passed,
      actual: readFact(ctx, node.fact),
      required: `${node.op} ${String(node.value)}`,
    };
  }
  return { conditionId, label: node.label ?? conditionId, passed };
}

function statusOf(truth: Truth): Status {
  if (truth === false) return 'ineligible';
  if (truth === null) return 'needs_check';
  return 'eligible';
}

export function createContext(rule: Rule, profile: UserProfile, options: EvalOptions): EvalContext {
  return {
    facts: computeFacts(profile, options),
    asOf: options.asOf,
    definitions: rule.definitions ?? {},
    lookups: rule.lookups ?? {},
  };
}

/** 상품 규칙 하나로 프로필을 판정합니다. 모든 날짜 계산은 options.asOf 기준입니다. */
export function evaluate(rule: Rule, profile: UserProfile, options: EvalOptions): Result {
  const ctx = createContext(rule, profile, options);
  const root = rule.conditions;
  const status = statusOf(evaluateNode(root, ctx));

  const checks =
    !isCondition(root) && 'all' in root
      ? root.all.map((child, i) => toCheck(child, i, ctx))
      : [toCheck(root, 0, ctx)];

  // 안내(notes)는 신청·한도·금리에 관한 말이라 불가일 때는 붙이지 않습니다.
  const notes =
    status === 'ineligible'
      ? []
      : (rule.notes ?? [])
          .filter((n) => holds(n.when, ctx) && (n.unless === undefined || !holds(n.unless, ctx)))
          .map((n) => n.text);

  const result: Result = {
    ruleId: rule.id,
    status,
    checks,
    notes,
    manualChecks: [...rule.manualChecks],
    timing: collectTiming(root, ctx, options.timingWithin ?? 'P3M'),
  };

  if (status !== 'ineligible') {
    const limit = rule.limit ? computeLimit(rule.limit, ctx) : undefined;
    if (limit !== undefined) result.estimatedLimit = limit;
    const rateRange = rule.rate ? computeRateRange(rule.rate, ctx) : undefined;
    if (rateRange !== undefined) result.rateRange = rateRange;
    const dti = rule.dti ? computeDti(rule.dti, rule.rate, ctx) : undefined;
    if (dti !== undefined) result.dti = dti;
  }
  return result;
}

/** 규칙이 asOf에 유효한지 (effectiveFrom ≤ asOf ≤ effectiveTo) */
export function isEffective(rule: Rule, asOf: string): boolean {
  return rule.effectiveFrom <= asOf && (rule.effectiveTo === undefined || asOf <= rule.effectiveTo);
}

/** 규칙 묶음 중 asOf에 유효한 규칙 전부로 판정합니다. */
export function evaluateAll(
  ruleSet: RuleSet,
  profile: UserProfile,
  options: EvalOptions,
): Result[] {
  return ruleSet.rules
    .filter((rule) => isEffective(rule, options.asOf))
    .map((rule) => evaluate(rule, profile, options));
}
