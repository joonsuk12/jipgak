import { useId, type ReactNode } from 'react';
import { digitsOnly, formatManWon } from '../../format';
import type { Amount, Choice } from './answers';

/**
 * 위저드 입력 부품. "모름"은 항상 점선 칸으로 보여 줍니다.
 * 비워 두거나 모름을 골라도 판정은 되고, 결과가 "확인 필요"가 될 뿐이라는 뜻입니다.
 */

const UNKNOWN_LABEL = '모름';
const GRID = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' } as const;

export function Question({
  label,
  hint,
  hideLabel = false,
  children,
}: {
  label: string;
  hint?: string;
  /** 제목(질문)과 같은 말이면 화면에서는 숨기고 읽기 프로그램에만 알립니다. */
  hideLabel?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset className="space-y-3" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className={hideLabel ? 'sr-only' : 'text-[15px] leading-6 font-semibold text-ink'}>
        {label}
      </legend>
      {hint && (
        <p
          id={`${id}-hint`}
          className="border-l-2 border-rule pl-3 text-sm leading-6 text-ink-soft"
        >
          {hint}
        </p>
      )}
      {children}
    </fieldset>
  );
}

const choiceBase =
  'min-h-12 rounded-md px-4 py-3 text-left text-[15px] leading-5 transition-colors duration-150';
const choiceOn = 'border-2 border-pine bg-pine-soft font-semibold text-ink';
const choiceOff = 'border border-rule bg-sheet text-ink hover:border-ink-soft';
const unknownOn = 'border-2 border-dashed border-ink-soft bg-paper font-semibold text-ink';
const unknownOff =
  'border border-dashed border-rule bg-transparent text-ink-soft hover:border-ink-soft';

export function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
  allowUnknown = true,
  columns = 1,
}: {
  value: Choice<T> | T | null;
  onChange: (next: Choice<T>) => void;
  options: { value: T; label: string }[];
  allowUnknown?: boolean;
  /** 3: 짧은 두 답 + 모름을 한 줄에 */
  columns?: 1 | 2 | 3;
}) {
  return (
    <div role="radiogroup" className={`grid gap-2 ${GRID[columns]}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`${choiceBase} ${value === o.value ? choiceOn : choiceOff}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
      {allowUnknown && (
        <button
          type="button"
          role="radio"
          aria-checked={value === 'unknown'}
          className={`${choiceBase} ${value === 'unknown' ? unknownOn : unknownOff}`}
          onClick={() => onChange('unknown')}
        >
          {UNKNOWN_LABEL}
        </button>
      )}
    </div>
  );
}

/** 금액(만 원) 또는 숫자 입력 + 모름 */
export function NumberField({
  value,
  onChange,
  unit,
  label,
  showMoney = true,
}: {
  value: Amount;
  onChange: (next: Amount) => void;
  unit: string;
  label: string;
  showMoney?: boolean;
}) {
  const id = useId();
  const unknown = value === null;
  const n = value ? Number(value) : NaN;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex gap-2">
        <div
          className={`flex min-h-12 flex-1 items-center rounded-md px-4 ${
            unknown
              ? 'border border-dashed border-rule bg-paper'
              : 'border border-rule bg-sheet focus-within:border-pine'
          }`}
        >
          <input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            disabled={unknown}
            placeholder={unknown ? '모름으로 판정해요' : '숫자만 입력'}
            className="w-full min-w-0 bg-transparent text-[17px] tabular-nums text-ink outline-none placeholder:text-[15px] placeholder:text-ink-soft/70 disabled:cursor-not-allowed"
            value={value ?? ''}
            onChange={(e) => onChange(digitsOnly(e.target.value))}
          />
          <span className="shrink-0 pl-2 text-sm text-ink-soft">{unit}</span>
        </div>
        <button
          type="button"
          aria-pressed={unknown}
          className={`${choiceBase} shrink-0 ${unknown ? unknownOn : unknownOff}`}
          onClick={() => onChange(unknown ? '' : null)}
        >
          {UNKNOWN_LABEL}
        </button>
      </div>
      {showMoney && !unknown && Number.isFinite(n) && n > 0 && (
        <p className="text-sm tabular-nums text-ink-soft">{formatManWon(n)}</p>
      )}
    </div>
  );
}

/** 날짜 입력 + 모름 */
export function DateField({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  label: string;
}) {
  const id = useId();
  const unknown = value === null;
  return (
    <div className="flex gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="date"
        disabled={unknown}
        className={`min-h-12 w-full min-w-0 flex-1 rounded-md px-4 text-[17px] text-ink ${
          unknown
            ? 'border border-dashed border-rule bg-paper text-ink-soft'
            : 'border border-rule bg-sheet focus:border-pine'
        }`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        aria-pressed={unknown}
        className={`${choiceBase} shrink-0 ${unknown ? unknownOn : unknownOff}`}
        onClick={() => onChange(unknown ? '' : null)}
      >
        {UNKNOWN_LABEL}
      </button>
    </div>
  );
}
