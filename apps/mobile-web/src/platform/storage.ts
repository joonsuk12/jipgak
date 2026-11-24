/**
 * 기기 안 저장소. 입력값은 여기에만 저장하고 서버로 보내지 않습니다.
 * 웹은 localStorage, 앱(v2, Capacitor)은 같은 인터페이스로 네이티브 구현을 추가합니다.
 */
export interface KeyValueStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** 저장이 막힌 환경(사생활 보호 모드 등)에서 쓰는 메모리 저장소. 새로고침하면 사라집니다. */
export class MemoryStorage implements KeyValueStorage {
  private readonly map = new Map<string, string>();
  get(key: string) {
    return this.map.get(key) ?? null;
  }
  set(key: string, value: string) {
    this.map.set(key, value);
  }
  remove(key: string) {
    this.map.delete(key);
  }
}

/** localStorage. 접근이 막히거나 용량이 차면 조용히 메모리로 대신합니다. */
export class WebStorage implements KeyValueStorage {
  private readonly fallback = new MemoryStorage();
  constructor(private readonly backing: Storage | undefined = safeLocalStorage()) {}

  get(key: string) {
    try {
      return this.backing ? this.backing.getItem(key) : this.fallback.get(key);
    } catch {
      return this.fallback.get(key);
    }
  }
  set(key: string, value: string) {
    try {
      if (this.backing) this.backing.setItem(key, value);
      else this.fallback.set(key, value);
    } catch {
      this.fallback.set(key, value);
    }
  }
  remove(key: string) {
    try {
      this.backing?.removeItem(key);
    } catch {
      // 지울 수 없으면 메모리 쪽만 지웁니다.
    }
    this.fallback.remove(key);
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

let shared: KeyValueStorage | undefined;

/** 앱 전체에서 쓰는 저장소 */
export function deviceStorage(): KeyValueStorage {
  shared ??= new WebStorage();
  return shared;
}
