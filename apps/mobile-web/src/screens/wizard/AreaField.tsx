import { useId, useState } from 'react';
import { decimalOnly, m2ToPyeong, pyeongToM2 } from '../../format';
import type { Amount } from './answers';
import { describePyeongType, PYEONG_TYPES } from './areaTypes';
import { NumberField } from './fields';
import { HOUSEHOLD_AREA, HOUSEHOLD_AREA_SOURCE } from './householdArea';

/**
 * 집 크기 입력 (D-25). 보이는 건 사람들에게 익숙한 평형(공급면적), 판정은 전용면적.
 * 1) 평형 버튼 → 그 평형의 흔한 전용면적으로 판정
 * 2) 등기부등본·분양 공고의 전용면적을 알면 ㎡로 직접 입력
 * 3) 전용면적을 평으로 알면 변환기
 * 분양 광고의 "34평형"을 평 → ㎡로 바꾸면 공급면적이라 틀리므로, 평형은 변환하지 않습니다.
 */
export function AreaField({ value, onChange }: { value: Amount; onChange: (v: Amount) => void }) {
  const [open, setOpen] = useState(false);
  const [pyeong, setPyeong] = useState('');
  const panelId = useId();
  const inputId = useId();
  const p = Number(pyeong);
  const converted = pyeong && Number.isFinite(p) && p > 0 ? pyeongToM2(p) : undefined;
  const current = value ? Number(value) : NaN;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div role="group" aria-label="평형으로 고르기" className="grid grid-cols-3 gap-2">
          {PYEONG_TYPES.map((t) => {
            const on = value === String(t.m2);
            return (
              <button
                key={t.type}
                type="button"
                aria-pressed={on}
                className={`min-h-16 rounded-md px-2 py-2 text-center leading-5 transition-colors duration-150 ${
                  on
                    ? 'border-2 border-pine bg-pine-soft'
                    : 'border border-rule bg-sheet hover:border-ink-soft'
                }`}
                onClick={() => onChange(String(t.m2))}
              >
                <span className="block font-serif text-lg font-bold">{t.type}</span>
                <span className="block text-xs text-ink-soft">전용 {t.m2}㎡</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm leading-6 text-ink-soft">
          평형을 고르면 그 평형에 흔한 전용면적으로 판정해요.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[15px] font-semibold">전용면적을 알면 직접 넣기</p>
        <p className="text-sm leading-6 text-ink-soft">
          등기부등본이나 분양 공고에 &lsquo;전용면적&rsquo;으로 적힌 값이에요. 이 값이 가장
          정확해요.
        </p>
        <NumberField
          label="전용면적"
          unit="㎡"
          showMoney={false}
          decimals
          value={value}
          onChange={onChange}
        />
        {value !== null && Number.isFinite(current) && current > 0 && (
          <p className="text-sm tabular-nums text-ink-soft">
            전용 약 {m2ToPyeong(current)}평, {describePyeongType(current)}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="text-sm font-medium text-pine underline underline-offset-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '평 변환 닫기' : '전용면적을 평으로 알고 있어요'}
      </button>

      {open && (
        <div id={panelId} className="space-y-3 border-l-2 border-pine pl-3">
          <p className="text-sm leading-6 text-ink-soft">
            &lsquo;34평형&rsquo;처럼 광고에 나오는 평형은 여기에 넣지 마세요. 공용 부분까지 포함한
            크기라 틀려요. 평형은 위 버튼에서 고르면 돼요.
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              전용 평수
            </label>
            <div className="flex min-h-12 flex-1 items-center rounded-md border border-rule bg-sheet px-4 focus-within:border-pine focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pine">
              <input
                id={inputId}
                inputMode="decimal"
                autoComplete="off"
                placeholder="전용 평수"
                className="w-full min-w-0 bg-transparent text-[17px] tabular-nums outline-none placeholder:text-[15px] placeholder:text-ink-soft/70"
                value={pyeong}
                onChange={(e) => setPyeong(decimalOnly(e.target.value))}
              />
              <span className="shrink-0 pl-2 text-sm text-ink-soft">평</span>
            </div>
            <button
              type="button"
              disabled={converted === undefined}
              className="min-h-12 shrink-0 rounded-md bg-ink px-4 text-sm font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
              onClick={() => {
                if (converted === undefined) return;
                onChange(String(converted));
                setOpen(false);
              }}
            >
              {converted === undefined ? '㎡로 넣기' : `${converted}㎡로 넣기`}
            </button>
          </div>
        </div>
      )}

      <details className="text-sm text-ink-soft">
        <summary className="cursor-pointer py-1 font-medium text-pine">
          다른 집은 보통 얼마나 넓게 살까요?
        </summary>
        <div className="mt-2 space-y-2">
          <table className="w-full border-y border-rule text-left tabular-nums">
            <caption className="sr-only">가구원 수별 평균 집 크기</caption>
            <thead>
              <tr className="border-b border-rule text-xs">
                <th scope="col" className="py-1.5 font-medium">
                  가구원
                </th>
                <th scope="col" className="py-1.5 font-medium">
                  평형으로 치면
                </th>
                <th scope="col" className="py-1.5 font-medium">
                  평균 전용면적
                </th>
              </tr>
            </thead>
            <tbody>
              {HOUSEHOLD_AREA.map((h) => (
                <tr key={h.members} className="border-b border-rule text-ink last:border-0">
                  <th scope="row" className="py-1.5 font-normal">
                    {h.members}
                  </th>
                  <td className="py-1.5">{describePyeongType(h.m2)}</td>
                  <td className="py-1.5">{h.m2}㎡</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="leading-6">
            평형은 위의 흔한 평형(25·30·34평형) 기준으로 어림한 거예요. 평균 전용면적은{' '}
            {HOUSEHOLD_AREA_SOURCE.label}이에요(최신 값과 다를 수 있어요).{' '}
            <a
              className="underline"
              href={HOUSEHOLD_AREA_SOURCE.url}
              target="_blank"
              rel="noreferrer"
            >
              원문 보기
            </a>
          </p>
        </div>
      </details>
    </div>
  );
}
