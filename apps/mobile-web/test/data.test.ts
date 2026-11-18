import { describe, expect, it, vi } from 'vitest';
import configJson from '../../../public-config/config.json';
import { DEFAULT_CONFIG, parseConfig } from '../src/data/config';
import { createRulesSource } from '../src/data/factory';
import type { Config, RuleSet, RulesSource } from '../src/data/sources';
import { StaticConfigSource } from '../src/data/static/StaticConfigSource';
import { StaticRulesSource } from '../src/data/static/StaticRulesSource';
import { withFallback } from '../src/data/withFallback';

const failing: RulesSource = { getRuleSet: () => Promise.reject(new Error('down')) };
const apiConfig: Config = {
  ...DEFAULT_CONFIG,
  features: { ...DEFAULT_CONFIG.features, rules: 'api' },
};

describe('config', () => {
  it('public-config/config.json 이 유효하다', () => {
    expect(parseConfig(configJson)).toEqual(configJson);
  });

  it('잘못된 값은 기본값으로', () => {
    expect(parseConfig({ features: { rules: 'nope' } })).toEqual(DEFAULT_CONFIG);
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it('config.json을 받지 못하면 기본값', async () => {
    const source = new StaticConfigSource(() => Promise.reject(new Error('offline')));
    await expect(source.getConfig()).resolves.toEqual(DEFAULT_CONFIG);
  });

  it('받은 config.json을 검증해 쓴다', async () => {
    const source = new StaticConfigSource(() => Promise.resolve(Response.json(apiConfig)));
    await expect(source.getConfig()).resolves.toEqual(apiConfig);
  });
});

describe('rules source', () => {
  it('static은 내장 규칙 2개를 준다', async () => {
    const set = await new StaticRulesSource().getRuleSet();
    expect(set.rules.map((r) => r.id).sort()).toEqual([
      'loan-newlywed-jeonse',
      'loan-newlywed-purchase',
    ]);
  });

  it('withFallback: primary 실패 시 fallback', async () => {
    const onError = vi.fn();
    const fallbackSet: RuleSet = { version: 'x', rules: [] };
    const source = withFallback(
      failing,
      { getRuleSet: () => Promise.resolve(fallbackSet) },
      onError,
    );
    await expect(source.getRuleSet()).resolves.toBe(fallbackSet);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('api 토글이어도 (미구현) static으로 폴백한다', async () => {
    const set = await createRulesSource(apiConfig).getRuleSet();
    expect(set.rules).toHaveLength(2);
  });
});
