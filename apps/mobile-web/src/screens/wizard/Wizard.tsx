import { useEffect, useMemo, useRef, useState } from 'react';
import { evaluate, type RuleSet } from '@jipgak/rules-engine';
import { ResultCard, ResultSummary } from '../../components/ResultCard';
import { todayISO } from '../../format';
import {
  type Answers,
  emptyAnswers,
  ruleIdsFor,
  stepForCondition,
  toProfile,
  visibleSteps,
} from './answers';
import {
  AssetsStep,
  HistoryStep,
  IncomeStep,
  JeonseHomeStep,
  MarriageStep,
  PurchaseHomeStep,
  PurposeStep,
  STEP_META,
} from './steps';

/** 입력 위저드: 한 화면에 한 주제씩 묻고, 마지막에 기기 안에서 판정합니다. */
export function Wizard({ ruleSet }: { ruleSet: RuleSet }) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [index, setIndex] = useState(0);
  /** 결과에서 "답하러 가기"로 왔으면 다음 버튼이 결과로 바로 돌아갑니다. */
  const [fromResult, setFromResult] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = visibleSteps(answers);
  const stepId = steps[Math.min(index, steps.length - 1)] ?? 'purpose';
  // 목적을 고르기 전에는 가장 긴 경우(둘 다)로 단계 수를 보여 줍니다.
  const inputSteps = visibleSteps({ ...answers, purpose: answers.purpose ?? 'both' }).filter(
    (s) => s !== 'result',
  );
  const isResult = stepId === 'result';
  const canNext = stepId !== 'purpose' || answers.purpose !== null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [stepId]);

  const update = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));
  const go = (next: number) => setIndex(Math.max(0, Math.min(next, steps.length - 1)));
  const fix = (ruleId: string, conditionId: string) => {
    const target = stepForCondition(ruleId, conditionId);
    const i = target ? steps.indexOf(target) : -1;
    if (i < 0) return;
    setFromResult(true);
    setIndex(i);
  };

  const results = useMemo(() => {
    if (!isResult) return [];
    const profile = toProfile(answers);
    const asOf = todayISO();
    return ruleIdsFor(answers)
      .map((id) => ruleSet.rules.find((r) => r.id === id))
      .filter((r) => r !== undefined)
      .map((rule) => ({ rule, result: evaluate(rule, profile, { asOf }) }));
  }, [isResult, answers, ruleSet]);

  const body = {
    purpose: <PurposeStep a={answers} update={update} />,
    marriage: <MarriageStep a={answers} update={update} />,
    income: <IncomeStep a={answers} update={update} />,
    assets: <AssetsStep a={answers} update={update} />,
    history: <HistoryStep a={answers} update={update} />,
    purchaseHome: <PurchaseHomeStep a={answers} update={update} />,
    jeonseHome: <JeonseHomeStep a={answers} update={update} />,
    result: (
      <div className="space-y-12">
        <ResultSummary items={results} />
        {results.map(({ rule, result }) => (
          <ResultCard
            key={rule.id}
            rule={rule}
            result={result}
            onFix={(conditionId) => fix(rule.id, conditionId)}
          />
        ))}
        <p className="text-sm leading-6 text-ink-soft">
          참고용 결과예요. 실제 자격과 한도는 기금 수탁은행 심사로 정해져요.
        </p>
      </div>
    ),
  }[stepId];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 bg-paper/95 px-4 pt-4 pb-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-baseline justify-between">
          <span className="font-serif text-lg font-bold">집각</span>
          {!isResult && (
            <span className="text-sm tabular-nums text-ink-soft">
              {STEP_META[stepId].short} {index + 1}/{inputSteps.length}
            </span>
          )}
        </div>
        {!isResult && (
          <ol className="mx-auto mt-3 flex max-w-md gap-1" aria-label="진행 단계">
            {inputSteps.map((s, i) => (
              <li
                key={s}
                aria-current={i === index ? 'step' : undefined}
                className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-pine' : 'bg-rule'}`}
              >
                <span className="sr-only">{STEP_META[s].short}</span>
              </li>
            ))}
          </ol>
        )}
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-32">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mb-8 font-serif text-[28px] leading-[1.35] font-bold tracking-tight outline-none"
        >
          {STEP_META[stepId].title}
        </h1>
        {body}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-rule bg-paper px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md gap-2">
          {isResult ? (
            <>
              <button
                type="button"
                className="min-h-12 flex-1 rounded-md border border-rule bg-sheet px-4 font-medium"
                onClick={() => go(index - 1)}
              >
                답 고치기
              </button>
              <button
                type="button"
                className="min-h-12 flex-1 rounded-md bg-ink px-4 font-semibold text-paper"
                onClick={() => {
                  setAnswers(emptyAnswers());
                  setFromResult(false);
                  setIndex(0);
                }}
              >
                처음부터 다시
              </button>
            </>
          ) : (
            <>
              {index > 0 && (
                <button
                  type="button"
                  className="min-h-12 rounded-md border border-rule bg-sheet px-5 font-medium"
                  onClick={() => go(index - 1)}
                >
                  이전
                </button>
              )}
              <button
                type="button"
                disabled={!canNext}
                className="min-h-12 flex-1 rounded-md bg-pine px-4 font-semibold text-white disabled:bg-rule disabled:text-ink-soft"
                onClick={() => go(fromResult ? steps.length - 1 : index + 1)}
              >
                {fromResult
                  ? '결과 다시 보기'
                  : steps[index + 1] === 'result'
                    ? '결과 보기'
                    : '다음'}
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
