import { products, rulesVersion } from '@jipgak/rules-data';
import type { Rule } from '@jipgak/rules-engine';
import type { RuleSet, RulesSource } from '../sources';

/**
 * 앱에 내장한 기본 규칙. 정적 호스팅의 /rules 번들 + manifest 확인과 로컬 캐시는
 * 규칙 번들 빌드(rules-data/build.ts)를 만든 뒤 여기에 추가합니다.
 */
export class StaticRulesSource implements RulesSource {
  getRuleSet(): Promise<RuleSet> {
    return Promise.resolve({ version: rulesVersion, rules: products as Rule[] });
  }
}
