import type { RuleSet } from '@jipgak/rules-engine';

/**
 * 화면이 의존하는 데이터 인터페이스. 화면 코드는 fetch를 직접 호출하지 않고 이 인터페이스만 씁니다.
 * 구현: static(정적 호스팅·앱 내장본), api(서버 모드, v3에서 구현)
 */

export type { RuleSet };

export type FeatureMode = 'static' | 'api';
export type OptionalFeatureMode = FeatureMode | 'off';

export interface Config {
  apiBaseUrl: string;
  features: {
    rules: FeatureMode;
    notices: OptionalFeatureMode;
    profileSync: OptionalFeatureMode;
    ads: 'on' | 'off';
  };
}

export interface RulesSource {
  getRuleSet(): Promise<RuleSet>;
}

export interface ConfigSource {
  getConfig(): Promise<Config>;
}
