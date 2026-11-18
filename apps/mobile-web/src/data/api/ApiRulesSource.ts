import type { RuleSet, RulesSource } from '../sources';

/** 서버 모드(FastAPI) 자리. v3 전까지 구현하지 않으며, 호출되면 실패해 static으로 폴백합니다. */
export class ApiRulesSource implements RulesSource {
  constructor(readonly baseUrl: string) {}

  getRuleSet(): Promise<RuleSet> {
    return Promise.reject(new Error('api 모드는 아직 구현하지 않았습니다 (v3)'));
  }
}
