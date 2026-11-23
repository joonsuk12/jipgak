import type { Result, Rule, Status } from '@jipgak/rules-engine';
import { formatWon } from '../format';

const STATUS: Record<Status, { label: string; mark: string; className: string }> = {
  eligible: { label: '가능', mark: '✓', className: 'border-pine text-pine bg-pine-soft' },
  needs_check: {
    label: '확인 필요',
    mark: '?',
    className: 'border-amber text-amber bg-amber-soft border-dashed',
  },
  ineligible: { label: '불가', mark: '✕', className: 'border-seal text-seal bg-seal-soft' },
};

function rateText(range: NonNullable<Result['rateRange']>): string {
  const f = (n: number) => `${n.toFixed(2)}%`;
  return range.min === range.max ? `연 ${f(range.min)}` : `연 ${f(range.min)} ~ ${f(range.max)}`;
}

/** 상품 하나의 판정 결과: 상태, 예상 한도·금리, 조건별 체크리스트, 안내 */
export function ResultCard({ rule, result }: { rule: Rule; result: Result }) {
  const status = STATUS[result.status];
  const failed = result.checks.filter((c) => c.passed === false);
  const unknown = result.checks.filter((c) => c.passed === null);

  return (
    <article className="space-y-5 border-t-2 border-ink pt-5">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-serif text-xl leading-7 font-bold">{rule.name}</h3>
          <p className="text-sm text-ink-soft">
            {result.status === 'eligible' && '입력한 내용으로는 조건을 모두 충족해요.'}
            {result.status === 'needs_check' &&
              `모르는 항목 ${unknown.length}개를 확인하면 결과가 정해져요.`}
            {result.status === 'ineligible' && `맞지 않는 조건이 ${failed.length}개 있어요.`}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-md border-2 px-2.5 py-1 text-sm font-semibold ${status.className}`}
        >
          <span aria-hidden="true">{status.mark}</span>
          {status.label}
        </span>
      </header>

      {(result.estimatedLimit !== undefined || result.rateRange) && (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-ink-soft">예상 한도</dt>
            <dd className="font-serif text-2xl leading-8 font-bold tabular-nums">
              {result.estimatedLimit !== undefined ? formatWon(result.estimatedLimit) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">예상 금리</dt>
            <dd className="font-serif text-2xl leading-8 font-bold tabular-nums">
              {result.rateRange ? rateText(result.rateRange) : '—'}
            </dd>
          </div>
        </dl>
      )}

      <ul className="divide-y divide-rule border-y border-rule">
        {result.checks.map((c) => (
          <li key={c.conditionId} className="flex gap-3 py-2.5 text-[15px] leading-6">
            <span
              aria-label={c.passed === true ? '충족' : c.passed === false ? '미충족' : '모름'}
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold ${
                c.passed === true
                  ? 'bg-pine text-white'
                  : c.passed === false
                    ? 'bg-seal text-white'
                    : 'border border-dashed border-ink-soft text-ink-soft'
              }`}
            >
              {c.passed === true ? '✓' : c.passed === false ? '✕' : '?'}
            </span>
            <span className={c.passed === false ? 'text-seal' : ''}>{c.label}</span>
          </li>
        ))}
      </ul>

      {result.notes.length > 0 && (
        <ul className="space-y-2">
          {result.notes.map((n) => (
            <li key={n} className="bg-pine-soft px-3 py-2 text-sm leading-6 text-ink">
              {n}
            </li>
          ))}
        </ul>
      )}

      <details className="text-sm text-ink-soft">
        <summary className="cursor-pointer py-1 font-medium text-ink">
          은행에서 직접 확인할 항목 {result.manualChecks.length}개
        </summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6">
          {result.manualChecks.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </details>

      <p className="text-xs text-ink-soft">
        기준: {rule.source.title} ·{' '}
        <a className="underline" href={rule.source.url} target="_blank" rel="noreferrer">
          원문 보기
        </a>{' '}
        (확인일 {rule.source.checkedAt})
      </p>
    </article>
  );
}
