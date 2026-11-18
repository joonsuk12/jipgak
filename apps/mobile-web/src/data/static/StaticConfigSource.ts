import { DEFAULT_CONFIG, parseConfig } from '../config';
import type { Config, ConfigSource } from '../sources';

/** 정적 호스팅의 /config.json. 받지 못하면 기본 설정을 씁니다. */
export class StaticConfigSource implements ConfigSource {
  constructor(
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
    private readonly url = '/config.json',
  ) {}

  async getConfig(): Promise<Config> {
    try {
      const res = await this.fetchFn(this.url, { cache: 'no-cache' });
      if (!res.ok) return DEFAULT_CONFIG;
      return parseConfig(await res.json());
    } catch {
      return DEFAULT_CONFIG;
    }
  }
}
