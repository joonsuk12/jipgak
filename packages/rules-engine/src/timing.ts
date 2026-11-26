import { type EvalContext, evaluateNode, isCondition, readFact } from './conditions';
import { parseDuration, shiftDate } from './dates';
import type { ConditionNode, DateCondition, ISODate, TimingNote } from './types';

/**
 * 접수일 기준 날짜 안내. 판정은 기준일(asOf) 하루로 하지만 실제 기준은 대출 접수일이라,
 * 날짜 조건이 곧 바뀌면 그 날짜를 알려 줍니다.
 *
 * 날짜 조건(withinPast / withinNext)이 `all` 묶음 안에 있고 같은 묶음의 다른 조건이 모두 참일 때만 봅니다.
 * (예: "기혼 + 혼인 7년 이내" 묶음에서 기혼이 참일 때만 7년 기한을 안내)
 * - withinPast가 참이고 끝나는 날(날짜 + 기간)이 within 안에 오면 expires
 * - withinNext가 거짓이고 날짜가 기간보다 멀면, 날짜 − 기간부터 충족하므로 opens
 */
export function collectTiming(root: ConditionNode, ctx: EvalContext, within: string): TimingNote[] {
  const notes: TimingNote[] = [];
  const horizon = shiftDate(ctx.asOf, parseDuration(within), 1);

  const visit = (node: ConditionNode, depth: number): void => {
    if (depth > 16 || isCondition(node)) return;
    if ('ref' in node) {
      const target = ctx.definitions[node.ref];
      if (target) visit(target, depth + 1);
      return;
    }
    if ('any' in node) {
      node.any.forEach((child) => visit(child, depth + 1));
      return;
    }
    const children = node.all;
    children.forEach((child, i) => {
      if (isDateCondition(child)) {
        const othersTrue = children.every((c, j) => j === i || evaluateNode(c, ctx) === true);
        if (othersTrue) {
          const note = timingFor(child, ctx, horizon);
          if (note) notes.push(note);
        }
      } else {
        visit(child, depth + 1);
      }
    });
  };

  visit(root, 0);
  return notes;
}

function isDateCondition(node: ConditionNode): node is DateCondition {
  return isCondition(node) && (node.op === 'withinPast' || node.op === 'withinNext');
}

function timingFor(cond: DateCondition, ctx: EvalContext, horizon: ISODate): TimingNote | null {
  const date = readFact(ctx, cond.fact);
  if (typeof date !== 'string') return null;
  const duration = parseDuration(cond.value);
  const truth = evaluateNode(cond, ctx);

  if (cond.op === 'withinPast' && truth === true) {
    const lastDay = shiftDate(date, duration, 1);
    if (lastDay <= horizon) {
      return { kind: 'expires', conditionId: cond.id, label: cond.label, date: lastDay };
    }
  }
  if (cond.op === 'withinNext' && truth === false) {
    const latest = shiftDate(ctx.asOf, duration, 1);
    if (date > latest) {
      return {
        kind: 'opens',
        conditionId: cond.id,
        label: cond.label,
        date: shiftDate(date, duration, -1),
      };
    }
  }
  return null;
}
