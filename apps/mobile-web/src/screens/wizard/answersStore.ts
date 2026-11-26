import type { KeyValueStorage } from '../../platform/storage';
import { type Answers, emptyAnswers, type HomeAnswers } from './answers';
import { ASSET_ITEMS, type AssetItemValues } from './assetItems';
import { ALL_ZONE_IDS, SIDOS } from './zones';

/**
 * 위저드 답을 기기에만 저장합니다(D-22). 서버·로그·분석으로는 보내지 않습니다.
 * 불러올 때는 값을 하나씩 검사해서, 모르는 값은 버리고 기본값을 씁니다.
 */
export const ANSWERS_KEY = 'jipgak.answers.v1';

export interface SavedWizard {
  answers: Answers;
  /** 마지막으로 보던 단계 번호 */
  index: number;
}

interface StoredShape {
  version: 1;
  answers: unknown;
  index: unknown;
}

// ───────────────────────── 값 검사 ─────────────────────────

type Check<T> = (v: unknown) => v is T;

const oneOf =
  <T extends string>(...allowed: T[]): Check<T | null> =>
  (v): v is T | null =>
    v === null || (typeof v === 'string' && (allowed as string[]).includes(v));

/** 금액·면적: 숫자(면적은 소수 둘째 자리까지) 문자열, 빈 문자열, 또는 null(모름) */
const isAmount: Check<string | null> = (v): v is string | null =>
  v === null || (typeof v === 'string' && /^\d{0,12}(\.\d{0,2})?$/.test(v));

const isDate: Check<string | null> = (v): v is string | null =>
  v === null || (typeof v === 'string' && (v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v)));

const isYesNo = oneOf('yes', 'no', 'unknown');

function pick<T>(raw: Record<string, unknown>, key: string, check: Check<T>, fallback: T): T {
  const v = raw[key];
  return check(v) ? v : fallback;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function restoreHome(raw: unknown, empty: HomeAnswers): HomeAnswers {
  const r = asRecord(raw);
  return {
    region: pick(r, 'region', oneOf('metro', 'local', 'unknown'), empty.region),
    sido: pick(r, 'sido', oneOf(...SIDOS.map((x) => x.id), 'unknown'), empty.sido),
    zone: pick(r, 'zone', oneOf(...ALL_ZONE_IDS, 'unknown'), empty.zone),
    regulated: pick(r, 'regulated', isYesNo, empty.regulated),
    amount: pick(r, 'amount', isAmount, empty.amount),
    area: pick(r, 'area', isAmount, empty.area),
    ruralTownship: pick(r, 'ruralTownship', isYesNo, empty.ruralTownship),
    contract: pick(r, 'contract', isYesNo, empty.contract),
  };
}

function restoreAssetItems(raw: unknown, empty: AssetItemValues): AssetItemValues {
  const r = asRecord(raw);
  const out = { ...empty };
  for (const item of ASSET_ITEMS) out[item.key] = pick(r, item.key, isAmount, empty[item.key]);
  return out;
}

/** 저장된 값 → 검사한 Answers. 객체가 아니면 null */
export function restoreAnswers(raw: unknown): Answers | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const e = emptyAnswers();
  return {
    purpose: pick(r, 'purpose', oneOf('purchase', 'jeonse', 'both'), e.purpose),
    marriageStatus: pick(r, 'marriageStatus', oneOf('married', 'planned'), e.marriageStatus),
    marriageDate: pick(r, 'marriageDate', isDate, e.marriageDate),
    children: pick(r, 'children', oneOf('0', '1', '2', '3', 'unknown'), e.children),
    applicantIncome: pick(r, 'applicantIncome', isAmount, e.applicantIncome),
    spouseIncome: pick(r, 'spouseIncome', isAmount, e.spouseIncome),
    netAssets: pick(r, 'netAssets', isAmount, e.netAssets),
    assetItems: restoreAssetItems(r.assetItems, e.assetItems),
    allHomeless: pick(r, 'allHomeless', isYesNo, e.allHomeless),
    everOwnedHome: pick(r, 'everOwnedHome', isYesNo, e.everOwnedHome),
    everHadFundPurchaseLoan: pick(r, 'everHadFundPurchaseLoan', isYesNo, e.everHadFundPurchaseLoan),
    hasFundLoan: pick(r, 'hasFundLoan', isYesNo, e.hasFundLoan),
    hasMortgageLoan: pick(r, 'hasMortgageLoan', isYesNo, e.hasMortgageLoan),
    hasJeonseLoan: pick(r, 'hasJeonseLoan', isYesNo, e.hasJeonseLoan),
    livesInPublicRental: pick(r, 'livesInPublicRental', isYesNo, e.livesInPublicRental),
    purchase: restoreHome(r.purchase, e.purchase),
    jeonse: restoreHome(r.jeonse, e.jeonse),
  };
}

// ───────────────────────── 저장·불러오기 ─────────────────────────

export function loadWizard(storage: KeyValueStorage): SavedWizard | null {
  const text = storage.get(ANSWERS_KEY);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Partial<StoredShape>;
    if (parsed.version !== 1) return null;
    const answers = restoreAnswers(parsed.answers);
    if (!answers) return null;
    const index =
      typeof parsed.index === 'number' && Number.isInteger(parsed.index) && parsed.index >= 0
        ? parsed.index
        : 0;
    return { answers, index };
  } catch {
    return null;
  }
}

export function saveWizard(storage: KeyValueStorage, saved: SavedWizard): void {
  const shape: StoredShape = { version: 1, answers: saved.answers, index: saved.index };
  storage.set(ANSWERS_KEY, JSON.stringify(shape));
}

export function clearWizard(storage: KeyValueStorage): void {
  storage.remove(ANSWERS_KEY);
}

/** 저장해 둘 만한 답이 있는지 (목적만 고른 상태도 포함) */
export function hasAnyAnswer(a: Answers): boolean {
  return !sameValue(a, emptyAnswers());
}

/** 키 순서와 상관없이 값이 같은지 (답 객체는 문자열·null·평범한 객체로만 이뤄짐) */
function sameValue(x: unknown, y: unknown): boolean {
  if (x === y) return true;
  if (!x || !y || typeof x !== 'object' || typeof y !== 'object') return false;
  const xr = x as Record<string, unknown>;
  const yr = y as Record<string, unknown>;
  const keys = new Set([...Object.keys(xr), ...Object.keys(yr)]);
  for (const k of keys) if (!sameValue(xr[k], yr[k])) return false;
  return true;
}
