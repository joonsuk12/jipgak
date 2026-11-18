import type { UserProfile } from '@jipgak/rules-engine';

/**
 * 테스트 화면 입력 상태. 숫자 칸이 비어 있거나 선택이 '모름'이면 입력하지 않은 것으로 봅니다.
 * 금액은 만 원 단위로 입력받습니다(골든 케이스 문서와 같음).
 */
export type Tri = 'yes' | 'no' | 'unknown';

export interface FormState {
  asOf: string;
  marriageStatus: 'married' | 'planned';
  marriageDate: string;
  applicantIncome: string;
  spouseIncome: string;
  netAssets: string;
  childrenCount: string;
  allHomeless: Tri;
  everOwnedHome: Tri;
  hasFundLoan: Tri;
  hasMortgageLoan: Tri;
  hasJeonseLoan: Tri;
  livesInPublicRental: Tri;
  purchaseMetro: boolean;
  purchaseRegulated: Tri;
  purchasePrice: string;
  purchaseArea: string;
  purchaseContract: Tri;
  jeonseMetro: boolean;
  jeonseDeposit: string;
  jeonseArea: string;
  jeonseContract: Tri;
}

/** 골든 케이스 공통 기본값 + P01·J01 */
export const BASE_FORM: FormState = {
  asOf: '2026-11-17',
  marriageStatus: 'married',
  marriageDate: '2023-05-01',
  applicantIncome: '3500',
  spouseIncome: '2500',
  netAssets: '30000',
  childrenCount: '0',
  allHomeless: 'yes',
  everOwnedHome: 'no',
  hasFundLoan: 'no',
  hasMortgageLoan: 'no',
  hasJeonseLoan: 'no',
  livesInPublicRental: 'no',
  purchaseMetro: true,
  purchaseRegulated: 'no',
  purchasePrice: '50000',
  purchaseArea: '84',
  purchaseContract: 'yes',
  jeonseMetro: true,
  jeonseDeposit: '30000',
  jeonseArea: '59',
  jeonseContract: 'yes',
};

export interface Preset {
  id: string;
  label: string;
  patch: Partial<FormState>;
}

/** docs/golden-cases.md의 대표 사례 */
export const PRESETS: Preset[] = [
  { id: 'P01', label: 'P01·J01 기본 (기혼, 합산 6,000)', patch: {} },
  {
    id: 'P02',
    label: 'P02 1인 소득 기준 (5,500 + 3,500)',
    patch: { applicantIncome: '5500', spouseIncome: '3500' },
  },
  {
    id: 'P03',
    label: 'P03 소득 초과 (6,500 + 2,500)',
    patch: { applicantIncome: '6500', spouseIncome: '2500' },
  },
  {
    id: 'P05',
    label: 'P05 결혼 예정 2027-01-20',
    patch: { marriageStatus: 'planned', marriageDate: '2027-01-20' },
  },
  {
    id: 'P06',
    label: 'P06 결혼 예정 2027-04-30 (3개월 초과)',
    patch: { marriageStatus: 'planned', marriageDate: '2027-04-30' },
  },
  { id: 'P07', label: 'P07 혼인 7년 초과', patch: { marriageDate: '2018-03-01' } },
  {
    id: 'P09',
    label: 'P09·J03 지방 (구입 30,000 / 보증금 25,000)',
    patch: {
      applicantIncome: '1800',
      spouseIncome: '1200',
      purchaseMetro: false,
      purchasePrice: '30000',
      jeonseMetro: false,
      jeonseDeposit: '25000',
    },
  },
  { id: 'P11', label: 'P11 순자산 모름', patch: { netAssets: '' } },
  { id: 'J06', label: 'J06 순자산 40,000', patch: { netAssets: '40000' } },
  { id: 'J10', label: 'J10 기금대출 이용 여부 모름', patch: { hasFundLoan: 'unknown' } },
  {
    id: 'C1',
    label: '계약 전 (매매·임대차 계약 모름)',
    patch: { purchaseContract: 'unknown', jeonseContract: 'unknown' },
  },
];

const MAN = 10_000;

function money(value: string): number | undefined {
  const trimmed = value.replaceAll(',', '').trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * MAN) : undefined;
}

function num(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function tri(value: Tri): boolean | undefined {
  return value === 'unknown' ? undefined : value === 'yes';
}

/** undefined 값을 가진 키를 지웁니다(exactOptionalPropertyTypes 대응). */
function compact<T extends object>(obj: { [K in keyof T]: T[K] | undefined }): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function toProfile(f: FormState): UserProfile {
  const childrenCount = num(f.childrenCount) ?? 0;
  return compact<UserProfile>({
    applicant: compact({ annualIncome: money(f.applicantIncome) }),
    spouse: compact({ annualIncome: money(f.spouseIncome) }),
    marriage: compact({ status: f.marriageStatus, date: f.marriageDate || undefined }),
    netAssets: money(f.netAssets),
    household: compact({
      allHomeless: tri(f.allHomeless),
      everOwnedHome: tri(f.everOwnedHome),
      hasFundLoan: tri(f.hasFundLoan),
      hasMortgageLoan: tri(f.hasMortgageLoan),
      hasJeonseLoan: tri(f.hasJeonseLoan),
      livesInPublicRental: tri(f.livesInPublicRental),
    }),
    // 테스트 화면은 자녀 수만 받습니다. 출생일은 판정에 쓰지 않습니다.
    children: Array.from({ length: Math.floor(childrenCount) }, () => ({
      birthDate: '2020-01-01',
    })),
    purchase: compact({
      region: compact({ metro: f.purchaseMetro, regulated: tri(f.purchaseRegulated) }),
      price: money(f.purchasePrice),
      areaM2: num(f.purchaseArea),
      contractSigned: tri(f.purchaseContract),
    }),
    jeonse: compact({
      region: { metro: f.jeonseMetro },
      deposit: money(f.jeonseDeposit),
      areaM2: num(f.jeonseArea),
      contractSigned: tri(f.jeonseContract),
    }),
  });
}

/** 오늘 날짜 'YYYY-MM-DD' (기기 시간대 기준). 엔진 밖인 화면에서만 씁니다. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
