import { useEffect, useState } from 'react';
import type { RuleSet } from '@jipgak/rules-engine';
import { createConfigSource, createRulesSource } from '../data/factory';

type State = { kind: 'loading' } | { kind: 'ready'; ruleSet: RuleSet } | { kind: 'error' };

export function Home() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await createConfigSource().getConfig();
      const ruleSet = await createRulesSource(config).getRuleSet();
      if (!cancelled) setState({ kind: 'ready', ruleSet });
    })().catch(() => {
      if (!cancelled) setState({ kind: 'error' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">집각</h1>
        <p className="text-sm text-slate-600">
          신혼·예비부부 정책 대출 자격을 기기 안에서 판정합니다.
        </p>
      </header>

      {state.kind === 'loading' && <p className="text-sm text-slate-500">규칙을 불러오는 중…</p>}
      {state.kind === 'error' && (
        <p className="text-sm text-red-600">
          규칙을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      {state.kind === 'ready' && (
        <ul className="space-y-2">
          {state.ruleSet.rules.map((rule) => (
            <li key={rule.id} className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium">{rule.name}</p>
              <a
                className="text-xs text-blue-700 underline"
                href={rule.source.url}
                target="_blank"
                rel="noreferrer"
              >
                출처 확인일 {rule.source.checkedAt}
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        참고용 결과입니다. 최종 확인은 수탁은행과 공고문에서 해 주세요.
      </p>
    </section>
  );
}
