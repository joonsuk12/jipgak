import { useEffect, useState } from 'react';
import type { RuleSet } from './sources';
import { createConfigSource, createRulesSource } from './factory';

export type RuleSetState =
  { kind: 'loading' } | { kind: 'ready'; ruleSet: RuleSet } | { kind: 'error' };

/** config.json 토글에 맞는 출처에서 규칙 묶음을 불러옵니다. 화면은 fetch 대신 이 훅을 씁니다. */
export function useRuleSet(): RuleSetState {
  const [state, setState] = useState<RuleSetState>({ kind: 'loading' });
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
  return state;
}
