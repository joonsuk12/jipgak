import type { Check, Result, Rule, Status } from '@jipgak/rules-engine';
import { formatDateKo, formatWon } from '../format';
import { Help } from './Help';

/** 판정 도장. 가능 = 초록 실선, 확인 필요 = 점선("모름"과 같은 표시), 불가 = 빨강 */
const STAMP: Record<Status, { label: string; className: string }> = {
  eligible: { label: '가능', className: 'border-pine text-pine' },
  needs_check: { label: '확인 필요', className: 'border-dashed border-amber text-amber' },
  ineligible: { label: '불가', className: 'border-seal text-seal' },
};

export function StatusStamp({ status, size = 'md' }: { status: Status; size?: 'md' | 'lg' }) {
  const s = STAMP[status];
  const dims = size === 'lg' ? 'px-3 py-1.5 text-base' : 'px-2 py-0.5 text-sm';
  return (
    <span
      className={`inline-flex shrink-0 rotate-[-2deg] items-center rounded-sm border-2 font-serif font-bold ${dims} ${s.className}`}
    >
      {s.label}
    </span>
  );
}

function rateText(range: NonNullable<Result['rateRange']>): string {
  const f = (n: number) => n.toFixed(2);
  return range.min === range.max ? `연 ${f(range.min)}%` : `연 ${f(range.min)}~${f(range.max)}%`;
}

/** 금리표 열이 대출기간이면 범위가 기간 때문에 생긴다는 설명 (REVIEW 1-4, D-21) */
function rateCaption(rule: Rule): string {
  const columns = rule.rate?.table.columns;
  const base = `${
    rule.rate?.discounts.some((d) => d.id === 'subscription')
      ? '고른 우대(청약저축 등)를'
      : '입력한 조건을'
  } 반영한 금리예요. 금리 방식(고정·변동)에 따라 조금 더 붙을 수 있어요.`;
  if (columns?.kind !== 'term') return base;
  const years = columns.years;
  return `대출기간 ${Math.min(...years)}~${Math.max(...years)}년에 따라 달라요. ${base}`;
}

function CheckRow({
  check,
  onFix,
}: {
  check: Check;
  onFix?: ((conditionId: string) => void) | undefined;
}) {
  const failed = check.passed === false;
  return (
    <li className="flex items-start gap-3 py-3 text-[15px] leading-6">
      <span
        aria-label={failed ? '맞지 않음' : '모름'}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold ${
          failed ? 'bg-seal text-white' : 'border border-dashed border-ink-soft text-ink-soft'
        }`}
      >
        {failed ? '✕' : '?'}
      </span>
      <span className={`flex-1 ${failed ? 'text-seal' : ''}`}>{check.label}</span>
      {onFix && (
        <button
          type="button"
          className="shrink-0 rounded-md border border-rule bg-sheet px-3 py-1.5 text-sm font-medium text-ink hover:border-ink-soft"
          onClick={() => onFix(check.conditionId)}
        >
          {failed ? '답 고치기' : '답하러 가기'}
        </button>
      )}
    </li>
  );
}

/** 상품 하나의 판정 결과. 맞지 않는 조건 → 모르는 조건 → 충족한 조건(접힘) 순서 */
export function ResultCard({
  rule,
  result,
  onFix,
}: {
  rule: Rule;
  result: Result;
  /** 주면 미충족·모름 조건 옆에 해당 질문으로 가는 버튼을 보여 줍니다. */
  onFix?: (conditionId: string) => void;
}) {
  const failed = result.checks.filter((c) => c.passed === false);
  const unknown = result.checks.filter((c) => c.passed === null);
  const passed = result.checks.filter((c) => c.passed === true);

  return (
    <article id={`result-${rule.id}`} className="scroll-mt-20 space-y-6 border-t-2 border-ink pt-5">
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl leading-7 font-bold">{rule.name}</h3>
        <StatusStamp status={result.status} />
      </header>

      {result.timing.length > 0 && (
        <ul className="space-y-2">
          {result.timing.map((t) => (
            <li
              key={t.conditionId}
              className={`border-l-4 py-1 pl-3 ${t.kind === 'expires' ? 'border-amber' : 'border-pine'}`}
            >
              <p className="font-serif text-lg leading-7 font-bold">
                {formatDateKo(t.date)}
                {t.kind === 'expires' ? '까지 접수해야 해요' : '부터 신청할 수 있어요'}
              </p>
              <p className="text-sm leading-6 text-ink-soft">
                {t.kind === 'expires'
                  ? `그다음 날부터 '${t.label}' 기준에 맞지 않아요. 판정은 대출 접수일 기준이에요.`
                  : `그날부터 '${t.label}' 기준에 맞아요. 그 전에 접수하면 대상이 아니에요.`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {(result.estimatedLimit !== undefined || result.rateRange) && (
        <div className="space-y-2">
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
          <Help
            term="estimate"
            hint={result.rateRange ? rateCaption(rule) : '입력값으로 계산한 추정치예요.'}
          />
          {result.dti &&
            result.estimatedLimit !== undefined &&
            result.dti.maxLoan < result.estimatedLimit && (
              <div role="status" className="space-y-1 bg-amber-soft px-3 py-2 text-ink">
                <p className="text-[15px] leading-6 font-semibold">
                  DTI 기준으로는 약 {formatWon(result.dti.maxLoan)}까지예요
                </p>
                <p className="text-sm leading-6 text-ink-soft">
                  1년에 갚는 원리금이 연소득({result.dti.singleIncome ? '신청인 1인' : '부부 합산'}{' '}
                  {formatWon(result.dti.income)})의 {Math.round(result.dti.maxRatio * 100)}%를 넘지
                  않는 금액이에요. 기존 대출이 없고 {result.dti.termYears}년 동안 매달 같은
                  금액(원리금균등)으로 갚는다고 보고 계산했어요. 기존 대출이 있으면 은행이 그
                  상환액까지 넣어 다시 계산해요.
                </p>
              </div>
            )}
        </div>
      )}

      {failed.length > 0 && (
        <section className="space-y-1">
          <h4 className="text-sm font-semibold text-seal">맞지 않는 조건 {failed.length}개</h4>
          <ul className="divide-y divide-rule border-y border-rule">
            {failed.map((c) => (
              <CheckRow key={c.conditionId} check={c} onFix={onFix} />
            ))}
          </ul>
        </section>
      )}

      {unknown.length > 0 && (
        <section className="space-y-1">
          <h4 className="text-sm font-semibold text-amber">
            답하면 결과가 정해지는 조건 {unknown.length}개
          </h4>
          <ul className="divide-y divide-rule border-y border-dashed border-rule">
            {unknown.map((c) => (
              <CheckRow key={c.conditionId} check={c} onFix={onFix} />
            ))}
          </ul>
        </section>
      )}

      {passed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer py-1 text-sm font-medium text-pine">
            충족한 조건 {passed.length}개
          </summary>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-6">
            {passed.map((c) => (
              <li key={c.conditionId} className="flex gap-3">
                <span
                  aria-label="충족"
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-pine text-xs font-bold text-white"
                >
                  ✓
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </details>
      )}

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
        <div className="mt-2">
          <Help term="manualCheck" />
        </div>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6">
          {result.manualChecks.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </details>

      <p className="text-xs leading-5 text-ink-soft">
        {rule.source.title} 안내를 {rule.source.checkedAt}에 확인해 만든 결과예요.{' '}
        <a className="underline" href={rule.source.url} target="_blank" rel="noreferrer">
          원문 보기
        </a>
      </p>
    </article>
  );
}

/** 결과 맨 위 요약: 상품마다 한 줄 (도장 + 예상 한도). 누르면 상세로 이동 */
export function ResultSummary({ items }: { items: { rule: Rule; result: Result }[] }) {
  return (
    <ul className="divide-y divide-rule border-y-2 border-ink">
      {items.map(({ rule, result }) => (
        <li key={rule.id}>
          <a
            href={`#result-${rule.id}`}
            onClick={(e) => {
              e.preventDefault();
              const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              document
                .getElementById(`result-${rule.id}`)
                ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
            }}
            className="flex items-center justify-between gap-3 py-4"
          >
            <span className="space-y-0.5">
              <span className="block text-[15px] font-semibold">{rule.name}</span>
              <span className="block text-sm tabular-nums text-ink-soft">
                {result.estimatedLimit !== undefined
                  ? `예상 한도 ${formatWon(result.estimatedLimit)}${
                      result.dti && result.dti.maxLoan < result.estimatedLimit
                        ? `, DTI 기준 약 ${formatWon(result.dti.maxLoan)}`
                        : ''
                    }`
                  : result.status === 'ineligible'
                    ? '조건이 맞지 않아요'
                    : '지역과 금액을 입력하면 한도를 계산해요'}
              </span>
            </span>
            <StatusStamp status={result.status} size="lg" />
          </a>
        </li>
      ))}
    </ul>
  );
}
