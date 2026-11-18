import { ApiRulesSource } from './api/ApiRulesSource';
import type { Config, ConfigSource, RulesSource } from './sources';
import { StaticConfigSource } from './static/StaticConfigSource';
import { StaticRulesSource } from './static/StaticRulesSource';
import { withFallback } from './withFallback';

export function createConfigSource(): ConfigSource {
  return new StaticConfigSource();
}

/** features.rules 토글에 따라 규칙 출처를 고릅니다. api는 실패 시 static으로 폴백합니다. */
export function createRulesSource(config: Config): RulesSource {
  const fallback = new StaticRulesSource();
  return config.features.rules === 'api'
    ? withFallback(new ApiRulesSource(config.apiBaseUrl), fallback)
    : fallback;
}
