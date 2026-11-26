import { useEffect, useState } from 'react';
import { useRuleSet } from './data/useRuleSet';
import { PrivacyPolicy } from './screens/PrivacyPolicy';
import { Playground } from './screens/playground/Playground';
import { Wizard } from './screens/wizard/Wizard';

/** 해시 경로: 기본은 입력 위저드, #/privacy 는 개인정보 처리방침, #/dev 는 개발용 판정 화면 */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export function App() {
  const state = useRuleSet();
  const route = useHashRoute();

  // 처리방침은 규칙 없이도 보여야 합니다.
  if (route === '#/privacy') return <PrivacyPolicy />;

  if (state.kind === 'loading') {
    return <p className="p-6 text-sm text-ink-soft">규칙을 불러오는 중이에요.</p>;
  }
  if (state.kind === 'error') {
    return (
      <p className="p-6 text-sm text-seal">
        규칙을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.
      </p>
    );
  }
  if (route === '#/dev') {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <Playground ruleSet={state.ruleSet} />
      </div>
    );
  }
  return <Wizard ruleSet={state.ruleSet} />;
}
