import { describe, expect, it } from 'vitest';
import { GLOSSARY, TERM, glossary, parseGlossary, type TermKey } from '../src/glossary';

describe('용어집 → 화면 도움말', () => {
  it('GLOSSARY.md에서 용어를 읽는다', () => {
    expect(GLOSSARY.size).toBeGreaterThan(30);
  });

  it.each(Object.keys(TERM) as TermKey[])('%s: 한 줄 안내와 상세가 있다', (key) => {
    const entry = glossary(key);
    expect(entry.hint.length).toBeGreaterThan(0);
    expect(entry.detail.length).toBeGreaterThan(0);
  });

  it('화면에 개발자 메모·파일 경로·결정 번호가 나오지 않는다', () => {
    for (const entry of GLOSSARY.values()) {
      for (const text of [entry.hint, ...entry.detail]) {
        expect(text).not.toMatch(/집각에서는|docs\/|`|\(D-\d+\)/);
      }
    }
  });

  it('파서: 별표, 안내, 상세, 메모 구분', () => {
    const md = [
      '**용어** ★',
      ': 💬 짧은 안내예요.',
      ': 긴 설명입니다. 자세한 기준: `docs/x.md`',
      ': 집각에서는: `fact.key`',
      '',
      '**다른 용어**',
      ': 💬 안내',
      ': 설명(`asOf`)입니다(D-3).',
    ].join('\n');
    const parsed = parseGlossary(md);
    expect(parsed.get('용어')).toEqual({
      term: '용어',
      starred: true,
      hint: '짧은 안내예요.',
      detail: ['긴 설명입니다.'],
    });
    expect(parsed.get('다른 용어')?.detail).toEqual(['설명입니다.']);
  });
});
