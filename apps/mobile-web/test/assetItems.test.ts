import { describe, expect, it } from 'vitest';
import {
  ASSET_ITEMS,
  emptyAssetItems,
  sumAssetItems,
  toNetAssetsAnswer,
} from '../src/screens/wizard/assetItems';
import { emptyAnswers, toProfile } from '../src/screens/wizard/answers';

describe('순자산 계산 도우미', () => {
  it('아무것도 안 넣으면 empty (순자산 칸을 바꾸지 않음)', () => {
    const sum = sumAssetItems(emptyAssetItems());
    expect(sum).toEqual({ kind: 'empty' });
    expect(toNetAssetsAnswer(sum)).toBeUndefined();
  });

  it('더하는 것 − 빼는 것', () => {
    const v = {
      ...emptyAssetItems(),
      deposit: '20000',
      savings: '3000',
      car: '1500',
      loans: '4500',
    };
    const sum = sumAssetItems(v);
    expect(sum).toEqual({ kind: 'total', total: 20000 });
    expect(toNetAssetsAnswer(sum)).toBe('20000');
  });

  it('하나라도 모름이면 합계도 모름', () => {
    const v = { ...emptyAssetItems(), deposit: '20000', stocks: null };
    const sum = sumAssetItems(v);
    expect(sum).toEqual({ kind: 'unknown', unknownLabels: ['주식·펀드'] });
    expect(toNetAssetsAnswer(sum)).toBeNull();
  });

  it('빚이 더 많으면 0으로 넣는다', () => {
    const v = { ...emptyAssetItems(), savings: '500', loans: '3000' };
    expect(sumAssetItems(v)).toEqual({ kind: 'total', total: -2500 });
    expect(toNetAssetsAnswer(sumAssetItems(v))).toBe('0');
  });

  it('마이너스통장 안내가 대출 항목에 있다 (원문: 한도대출 제외)', () => {
    const loans = ASSET_ITEMS.find((i) => i.key === 'loans');
    expect(loans?.sign).toBe(-1);
    expect(loans?.hint).toContain('마이너스통장');
  });

  it('항목별 값은 엔진 입력에 들어가지 않는다 (합계만)', () => {
    const a = {
      ...emptyAnswers(),
      netAssets: '20000',
      assetItems: { ...emptyAssetItems(), deposit: '20000' },
    };
    const profile = toProfile(a) as unknown as Record<string, unknown>;
    expect(profile.netAssets).toBe(200_000_000);
    expect(JSON.stringify(profile)).not.toContain('assetItems');
  });
});
