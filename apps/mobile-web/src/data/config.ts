import type { Config, FeatureMode, OptionalFeatureMode } from './sources';

export const DEFAULT_CONFIG: Config = {
  apiBaseUrl: '/api',
  features: { rules: 'static', notices: 'off', profileSync: 'off', ads: 'off' },
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((a) => a === value) ?? fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

const MODES: readonly FeatureMode[] = ['static', 'api'];
const OPTIONAL_MODES: readonly OptionalFeatureMode[] = ['static', 'api', 'off'];
const ON_OFF: readonly ('on' | 'off')[] = ['on', 'off'];

/** config.json 내용을 검증합니다. 모르는 값이나 빠진 값은 기본값으로 둡니다(fail-open). */
export function parseConfig(raw: unknown): Config {
  const obj = asRecord(raw);
  const f = asRecord(obj.features);
  const d = DEFAULT_CONFIG.features;
  return {
    apiBaseUrl: typeof obj.apiBaseUrl === 'string' ? obj.apiBaseUrl : DEFAULT_CONFIG.apiBaseUrl,
    features: {
      rules: pick(f.rules, MODES, d.rules),
      notices: pick(f.notices, OPTIONAL_MODES, d.notices),
      profileSync: pick(f.profileSync, OPTIONAL_MODES, d.profileSync),
      ads: pick(f.ads, ON_OFF, d.ads),
    },
  };
}
