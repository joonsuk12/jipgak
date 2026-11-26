import { useEffect, useMemo, useRef, useState } from 'react';
import { evaluate, type RuleSet } from '@jipgak/rules-engine';
import { ResultCard, ResultSummary } from '../../components/ResultCard';
import { todayISO } from '../../format';
import { deviceStorage } from '../../platform/storage';
import {
  type Answers,
  emptyAnswers,
  ruleIdsFor,
  stepForCondition,
  toProfile,
  visibleSteps,
} from './answers';
import { clearWizard, hasAnyAnswer, loadWizard, saveWizard } from './answersStore';
import { ApplyGuide, ResultIntro } from './ResultGuide';
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
  // 지난번 답을 기기에서 불러옵니다(D-22). 없거나 깨졌으면 빈 답으로 시작합니다.
  const [saved] = useState(() => loadWizard(deviceStorage()));
  const [answers, setAnswers] = useState<Answers>(() => saved?.answers ?? emptyAnswers());
  // 저장된 단계가 지금 답으로 보이는 단계 범위를 넘으면 마지막 단계로 맞춥니다.
  const [index, setIndex] = useState(() =>
    saved ? Math.min(saved.index, visibleSteps(saved.answers).length - 1) : 0,
  );
  const [restored, setRestored] = useState(() => saved !== null && hasAnyAnswer(saved.answers));
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

  // 답이 바뀔 때마다 이 기기에만 저장합니다. 서버·로그로는 보내지 않습니다.
  useEffect(() => {
    const storage = deviceStorage();
    if (hasAnyAnswer(answers)) saveWizard(storage, { answers, index });
    else clearWizard(storage);
  }, [answers, index]);

  const reset = () => {
    clearWizard(deviceStorage());
    setAnswers(emptyAnswers());
    setFromResult(false);
    setRestored(false);
    setIndex(0);
  };

  const update = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));
  const go = (next: number) => {
    setRestored(false);
    setIndex(Math.max(0, Math.min(next, steps.length - 1)));
  };
  const fix = (ruleId: string, conditionId: string) => {
    const target = stepForCondition(ruleId, conditionId);
    const i = target ? steps.indexOf(target) : -1;
    if (i < 0) return;
    setRestored(false);
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
      .map((rule) => {
        // 규칙 데이터에 문제가 있어도 화면 전체가 깨지지 않게 상품별로 오류를 보여 줍니다.
        try {
          return { rule, result: evaluate(rule, profile, { asOf }) };
        } catch {
          return { rule, error: true as const };
        }
      });
  }, [isResult, answers, ruleSet]);

  const body = {
    purpose: (
      <div className="space-y-9">
        <PurposeStep a={answers} update={update} />
        <StoredNotice hasAnswers={hasAnyAnswer(answers)} onClear={reset} />
      </div>
    ),
    marriage: <MarriageStep a={answers} update={update} />,
    income: <IncomeStep a={answers} update={update} />,
    assets: <AssetsStep a={answers} update={update} />,
    history: <HistoryStep a={answers} update={update} />,
    purchaseHome: <PurchaseHomeStep a={answers} update={update} />,
    jeonseHome: <JeonseHomeStep a={answers} update={update} />,
    result: (
      <div className="space-y-12">
        <ResultIntro rules={results.map((r) => r.rule)} today={todayISO()} />
        <ResultSummary
          items={results.flatMap((r) => (r.result ? [{ rule: r.rule, result: r.result }] : []))}
        />
        {results.map((r) =>
          r.result ? (
            <ResultCard
              key={r.rule.id}
              rule={r.rule}
              result={r.result}
              onFix={(conditionId) => fix(r.rule.id, conditionId)}
            />
          ) : (
            <p key={r.rule.id} role="alert" className="bg-seal-soft px-3 py-2 text-sm leading-6">
              {r.rule.name}을(를) 판정하지 못했어요. 규칙 데이터에 문제가 있어요. 앱을 새로고침해도
              같으면 잠시 뒤 다시 시도해 주세요.
            </p>
          ),
        )}
        <ApplyGuide ruleIds={results.map((r) => r.rule.id)} />
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
        {restored && (
          <p role="status" className="mb-8 bg-pine-soft px-3 py-2 text-sm leading-6 text-ink">
            지난번에 입력한 내용을 불러왔어요. 이어서 하면 돼요. 처음부터 하려면 첫 화면에서
            &lsquo;입력 지우기&rsquo;를 누르세요.
          </p>
        )}
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
                onClick={reset}
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

/** 저장 안내와 지우기. 공용 기기에서 쓰는 사람을 위해 첫 화면에 늘 보여 줍니다. */
function StoredNotice({ hasAnswers, onClear }: { hasAnswers: boolean; onClear: () => void }) {
  return (
    <div className="space-y-2 text-sm leading-6 text-ink-soft">
      <p>집각의 결과는 참고용 1차 판정이에요. 실제 자격과 한도는 기금 수탁은행 심사로 정해져요.</p>
      <p>
        입력한 내용은 서버로 보내지 않고 이 기기에만 저장해요.
        {hasAnswers && (
          <>
            {' '}
            <button
              type="button"
              className="font-medium text-pine underline underline-offset-2"
              onClick={onClear}
            >
              입력 지우기
            </button>
          </>
        )}{' '}
        <a className="underline underline-offset-2" href="#/privacy">
          개인정보 처리방침
        </a>
      </p>
    </div>
  );
}
