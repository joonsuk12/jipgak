import { describe, expect, it } from 'vitest';
import { MemoryStorage, WebStorage } from '../src/platform/storage';
import { emptyAnswers } from '../src/screens/wizard/answers';
import {
  ANSWERS_KEY,
  clearWizard,
  hasAnyAnswer,
  loadWizard,
  restoreAnswers,
  saveWizard,
} from '../src/screens/wizard/answersStore';

function filled() {
  const a = emptyAnswers();
  return {
    ...a,
    purpose: 'both' as const,
    marriageStatus: 'married' as const,
    marriageDate: '2023-05-01',
    applicantIncome: '3500',
    spouseIncome: null,
    netAssets: '18500',
    assetItems: { ...a.assetItems, deposit: '20000', loans: '4500' },
    hasFundLoan: 'unknown' as const,
    purchase: { ...a.purchase, region: 'metro' as const, amount: '50000' },
  };
}

describe('입력값 기기 저장', () => {
  it('저장한 답과 단계를 그대로 불러온다', () => {
    const s = new MemoryStorage();
    saveWizard(s, { answers: filled(), index: 3 });
    expect(loadWizard(s)).toEqual({ answers: filled(), index: 3 });
  });

  it('지우면 아무것도 불러오지 않는다', () => {
    const s = new MemoryStorage();
    saveWizard(s, { answers: filled(), index: 1 });
    clearWizard(s);
    expect(loadWizard(s)).toBeNull();
  });

  it('깨진 JSON, 다른 버전은 버린다', () => {
    const s = new MemoryStorage();
    s.set(ANSWERS_KEY, '{oops');
    expect(loadWizard(s)).toBeNull();
    s.set(ANSWERS_KEY, JSON.stringify({ version: 99, answers: filled(), index: 0 }));
    expect(loadWizard(s)).toBeNull();
  });

  it('모르는 값은 기본값으로 바꾸고, 새로 생긴 항목은 채운다', () => {
    const a = restoreAnswers({
      purpose: 'rent',
      marriageStatus: 'married',
      applicantIncome: '-500',
      spouseIncome: 3500,
      hasFundLoan: 'maybe',
      purchase: { region: 'busan', amount: '50000' },
    });
    expect(a?.purpose).toBeNull();
    expect(a?.marriageStatus).toBe('married');
    expect(a?.applicantIncome).toBe('');
    expect(a?.spouseIncome).toBe('');
    expect(a?.hasFundLoan).toBeNull();
    expect(a?.purchase.region).toBeNull();
    expect(a?.purchase.amount).toBe('50000');
    expect(a?.assetItems).toEqual(emptyAnswers().assetItems);
    expect(a?.jeonse).toEqual(emptyAnswers().jeonse);
  });

  it('소수점 면적도 저장·복원한다', () => {
    const a = restoreAnswers({ purchase: { area: '84.97' }, jeonse: { area: '59.9.9' } });
    expect(a?.purchase.area).toBe('84.97');
    expect(a?.jeonse.area).toBe('');
  });

  it('키 순서가 달라도 빈 답이면 저장할 내용이 없다', () => {
    const e = emptyAnswers();
    const reordered = Object.fromEntries(Object.entries(e).reverse()) as typeof e;
    expect(hasAnyAnswer(reordered)).toBe(false);
  });

  it('빈 답은 저장할 내용이 없다고 본다', () => {
    expect(hasAnyAnswer(emptyAnswers())).toBe(false);
    expect(hasAnyAnswer(filled())).toBe(true);
  });

  it('localStorage를 쓸 수 없으면 메모리로 대신한다', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const s = new WebStorage(broken);
    s.set('k', 'v');
    expect(s.get('k')).toBe('v');
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });
});
