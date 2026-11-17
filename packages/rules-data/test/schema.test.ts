import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import schema from '../schema.json';

const productsDir = join(import.meta.dirname, '..', 'products');
const files = readdirSync(productsDir).filter((f) => f.endsWith('.json'));

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
const validate = ajv.compile(schema);

describe('규칙 JSON 스키마', () => {
  it('상품 규칙 파일이 있다', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s 가 스키마를 통과한다', (file) => {
    const rule = JSON.parse(readFileSync(join(productsDir, file), 'utf8')) as { id: string };
    const ok = validate(rule);
    expect(validate.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
    expect(`${rule.id}.json`).toBe(file);
  });
});
