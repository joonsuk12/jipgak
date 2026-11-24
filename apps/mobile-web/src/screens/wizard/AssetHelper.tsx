import { useId, useState } from 'react';
import { formatManWon } from '../../format';
import type { Amount } from './answers';
import {
  ASSET_ITEMS,
  type AssetItem,
  type AssetItemValues,
  type AssetKey,
  sumAssetItems,
  toNetAssetsAnswer,
} from './assetItems';
import { NumberField } from './fields';

/**
 * 순자산 계산 도우미 (D-18). 더하는 것과 빼는 것을 항목별로 받아 계산서처럼 합계를 보여 주고,
 * "이 금액으로 넣기"를 누르면 순자산 칸을 채웁니다.
 */
export function AssetHelper({
  values,
  current,
  onChange,
  onApply,
}: {
  values: AssetItemValues;
  /** 지금 순자산 칸의 값. 계산서 합계와 다르면 알려 줍니다. */
  current: Amount;
  onChange: (next: AssetItemValues) => void;
  onApply: (netAssets: Amount) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sum = sumAssetItems(values);
  const answer = toNetAssetsAnswer(sum);

  const set = (key: AssetKey, v: Amount) => onChange({ ...values, [key]: v });

  // 계산서를 쓴 적이 있는데 순자산 칸과 합계가 다르면(넣은 뒤 항목을 고친 경우 등) 알려 줍니다.
  const mismatch = !open && answer !== undefined && answer !== current;

  return (
    <div className="space-y-4">
      {mismatch && (
        <div role="status" className="space-y-2 bg-amber-soft px-3 py-2 text-sm leading-6 text-ink">
          <p>
            계산서 합계({answer === null ? '모름' : formatManWon(Number(answer))})와 순자산 칸이
            달라요.
          </p>
          <button
            type="button"
            className="font-medium text-pine underline underline-offset-2"
            onClick={() => onApply(answer)}
          >
            계산서 합계로 바꾸기
          </button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="min-h-12 w-full rounded-md border border-rule bg-sheet px-4 text-left text-[15px] font-medium text-ink hover:border-ink-soft"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '계산서 닫기' : '모르겠으면 항목별로 계산하기'}
      </button>

      {open && (
        <div id={panelId} className="space-y-8 border-t-2 border-ink pt-5">
          <Ledger
            title="더하는 것"
            items={ASSET_ITEMS.filter((i) => i.sign === 1)}
            values={values}
            set={set}
          />
          <Ledger
            title="빼는 것"
            items={ASSET_ITEMS.filter((i) => i.sign === -1)}
            values={values}
            set={set}
          />

          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-y-[3px] border-double border-ink py-3">
              <span className="text-[15px] font-semibold">순자산 합계</span>
              <span aria-live="polite" className="font-serif text-2xl font-bold tabular-nums">
                {sum.kind === 'total' && formatManWon(Math.max(0, sum.total))}
                {sum.kind === 'unknown' && '모름'}
                {sum.kind === 'empty' && '0만 원'}
              </span>
            </div>
            {sum.kind === 'total' && sum.total < 0 && (
              <p className="text-sm leading-6 text-ink-soft">
                빚이 더 많아요. 0원으로 넣어도 판정 결과는 같아요.
              </p>
            )}
            {sum.kind === 'unknown' && (
              <p className="text-sm leading-6 text-ink-soft">
                {sum.unknownLabels.join(', ')}을(를) 몰라서 합계도 모름으로 넣어요. 결과는
                &lsquo;확인 필요&rsquo;가 돼요.
              </p>
            )}
            <button
              type="button"
              disabled={answer === undefined}
              className="min-h-12 w-full rounded-md bg-ink px-4 font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
              onClick={() => {
                if (answer === undefined) return;
                onApply(answer);
                setOpen(false);
              }}
            >
              이 금액으로 넣기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Ledger({
  title,
  items,
  values,
  set,
}: {
  title: string;
  items: AssetItem[];
  values: AssetItemValues;
  set: (key: AssetKey, v: Amount) => void;
}) {
  return (
    <section className="space-y-5">
      <h3 className="font-serif text-lg font-bold">{title}</h3>
      {items.map((item) => (
        <div key={item.key} className="space-y-2">
          <p className="text-[15px] leading-6 font-semibold">{item.label}</p>
          <p className="border-l-2 border-rule pl-3 text-sm leading-6 text-ink-soft">{item.hint}</p>
          <NumberField
            label={item.label}
            unit="만 원"
            placeholder="없으면 비워 두세요"
            value={values[item.key]}
            onChange={(v) => set(item.key, v)}
          />
        </div>
      ))}
    </section>
  );
}
