import { useId, useState } from 'react';
import { decimalOnly, m2ToPyeong, pyeongToM2 } from '../../format';
import type { Amount } from './answers';
import { NumberField } from './fields';

/**
 * 전용면적 입력. ㎡ 직접 입력 + 흔한 아파트 크기 고르기 + 전용 평 → ㎡ 변환.
 * 주의: 분양 광고의 "34평형"은 공용 부분을 포함한 공급면적이라 전용 평으로 바꾸면 틀립니다.
 * 그래서 평형은 변환하지 않고, 흔히 그 평형에 해당하는 전용면적을 고르게 합니다.
 */
const COMMON_SIZES = [
  { m2: '59', label: '59㎡', note: '흔히 24~25평형' },
  { m2: '74', label: '74㎡', note: '흔히 29~30평형' },
  { m2: '84', label: '84㎡', note: '흔히 33~34평형' },
] as const;

export function AreaField({ value, onChange }: { value: Amount; onChange: (v: Amount) => void }) {
  const [open, setOpen] = useState(false);
  const [pyeong, setPyeong] = useState('');
  const panelId = useId();
  const inputId = useId();
  const p = Number(pyeong);
  const converted = pyeong && Number.isFinite(p) && p > 0 ? pyeongToM2(p) : undefined;
  const current = value ? Number(value) : NaN;

  return (
    <div className="space-y-3">
      <NumberField
        label="전용면적"
        unit="㎡"
        showMoney={false}
        decimals
        value={value}
        onChange={onChange}
      />
      {value !== null && Number.isFinite(current) && current > 0 && (
        <p className="text-sm tabular-nums text-ink-soft">전용 약 {m2ToPyeong(current)}평</p>
      )}

      <div className="space-y-2">
        <p className="text-sm text-ink-soft">흔한 아파트 크기에서 고르기</p>
        <div role="group" aria-label="흔한 아파트 전용면적" className="grid grid-cols-3 gap-2">
          {COMMON_SIZES.map((s) => {
            const on = value === s.m2;
            return (
              <button
                key={s.m2}
                type="button"
                aria-pressed={on}
                className={`min-h-14 rounded-md px-2 py-2 text-center leading-5 transition-colors duration-150 ${
                  on
                    ? 'border-2 border-pine bg-pine-soft'
                    : 'border border-rule bg-sheet hover:border-ink-soft'
                }`}
                onClick={() => onChange(s.m2)}
              >
                <span className="block text-[15px] font-semibold">{s.label}</span>
                <span className="block text-xs text-ink-soft">{s.note}</span>
              </button>
            );
          })}
        </div>
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
            분양 광고의 &lsquo;34평형&rsquo; 같은 숫자는 공용 부분을 포함한 크기라 여기에 넣으면
            틀려요. 그럴 땐 위의 흔한 크기에서 고르세요.
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
    </div>
  );
}
