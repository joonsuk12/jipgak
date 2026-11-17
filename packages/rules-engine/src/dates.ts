import type { ISODate } from './types';

/**
 * 'YYYY-MM-DD' 날짜 계산. 시간대 영향을 받지 않도록 Date 객체를 쓰지 않고 정수로 계산합니다.
 */

interface YMD {
  y: number;
  m: number; // 1-12
  d: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DURATION = /^P(?=\d)(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/;

function daysInMonth(y: number, m: number): number {
  if (m === 2) {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

export function parseISODate(value: string): YMD | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function isISODate(value: unknown): value is ISODate {
  return typeof value === 'string' && parseISODate(value) !== null;
}

export function assertISODate(value: string, name: string): YMD {
  const parsed = parseISODate(value);
  if (!parsed) throw new Error(`${name}: 'YYYY-MM-DD' 형식의 날짜가 아닙니다 (${value})`);
  return parsed;
}

function format({ y, m, d }: YMD): ISODate {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 일 수를 더한 날짜 (음수 가능) */
function addDays(date: YMD, days: number): YMD {
  let { y, m, d } = date;
  d += days;
  while (d > daysInMonth(y, m)) {
    d -= daysInMonth(y, m);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  while (d < 1) {
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    d += daysInMonth(y, m);
  }
  return { y, m, d };
}

export interface Duration {
  years: number;
  months: number;
  days: number;
}

export function parseDuration(value: string): Duration {
  const match = DURATION.exec(value);
  if (!match) throw new Error(`ISO 8601 기간 형식이 아닙니다 (${value})`);
  return {
    years: Number(match[1] ?? 0),
    months: Number(match[2] ?? 0),
    days: Number(match[3] ?? 0),
  };
}

/**
 * 날짜에 기간을 더하거나(sign=1) 뺍니다(sign=-1).
 * 연·월을 먼저 계산하고, 그 달에 없는 날짜는 말일로 맞춘 뒤 일 수를 더합니다.
 * 예: 2026-11-17 + P3M = 2027-02-17, 2027-04-30 − P3M = 2027-01-30
 */
export function shiftDate(date: ISODate, duration: Duration, sign: 1 | -1): ISODate {
  const base = assertISODate(date, 'date');
  const totalMonths = base.y * 12 + (base.m - 1) + sign * (duration.years * 12 + duration.months);
  const y = Math.floor(totalMonths / 12);
  const m = (totalMonths % 12) + 1;
  const d = Math.min(base.d, daysInMonth(y, m));
  return format(addDays({ y, m, d }, sign * duration.days));
}

/** from부터 to까지 만으로 지난 햇수 (to < from이면 음수가 될 수 있음) */
export function fullYearsBetween(from: ISODate, to: ISODate): number {
  const a = assertISODate(from, 'from');
  const b = assertISODate(to, 'to');
  let years = b.y - a.y;
  if (b.m < a.m || (b.m === a.m && b.d < a.d)) years -= 1;
  return years;
}
