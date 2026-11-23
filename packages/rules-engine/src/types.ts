/**
 * 집각 판정 엔진 타입.
 * 금액은 모두 원 단위 정수(Won), 날짜는 'YYYY-MM-DD'(ISODate)입니다.
 * 입력값 `undefined`는 "모름"을 뜻하며, 판정에서 null(확인 필요)로 이어집니다.
 */

export type Won = number;
export type ISODate = string;

// ───────────────────────── 사용자 입력 ─────────────────────────

export interface Person {
  birthDate?: ISODate;
  /** 연소득 (원). undefined = 모름 */
  annualIncome?: Won;
}

/** 지역 구분. metro = 수도권(서울·인천·경기). undefined = 모름 */
export interface Region {
  metro?: boolean;
  /** 규제지역 여부 */
  regulated?: boolean;
  /** 수도권 외 도시지역이 아닌 읍·면 */
  ruralTownship?: boolean;
}

export interface Marriage {
  status: 'planned' | 'married';
  /** planned면 결혼 예정일, married면 혼인신고일 */
  date?: ISODate;
}

export interface Household {
  /** 세대원 전원 무주택 */
  allHomeless?: boolean;
  /** 세대원 중 주택 보유 이력 (생애최초 판정용) */
  everOwnedHome?: boolean;
  /** 세대원 중 기금 구입자금·중도금 대출 이용 이력 (상환 포함, 생애최초 판정용) */
  everHadFundPurchaseLoan?: boolean;
  /** 주택도시기금 대출 이용 중 */
  hasFundLoan?: boolean;
  /** 은행 주택담보대출 이용 중 */
  hasMortgageLoan?: boolean;
  /** 은행 전세자금대출(이주비 포함) 이용 중 */
  hasJeonseLoan?: boolean;
  /** 공공임대주택 입주 중 */
  livesInPublicRental?: boolean;
}

export interface PurchasePlan {
  region: Region;
  /** 매매가(담보 평가액으로 간주) */
  price?: Won;
  /** 전용면적 ㎡ */
  areaM2?: number;
  /** 주택매매계약 체결 여부 */
  contractSigned?: boolean;
  contractDate?: ISODate;
}

export interface JeonsePlan {
  region: Region;
  /** 임차보증금 */
  deposit?: Won;
  /** 전용면적 ㎡ */
  areaM2?: number;
  /** 임대차계약 체결 + 보증금 5% 이상 지불 여부 */
  contractSigned?: boolean;
  contractDate?: ISODate;
}

export interface UserProfile {
  /** 대출 신청인 */
  applicant: Person;
  spouse?: Person;
  marriage: Marriage;
  /** 부부합산 순자산 */
  netAssets?: Won;
  household: Household;
  children?: { birthDate: ISODate }[];
  /** 주택청약종합저축 */
  subscription?: { joinedAt: ISODate; paymentCount: number };
  purchase?: PurchasePlan;
  jeonse?: JeonsePlan;
}

// ───────────────────────── 파생값(facts) ─────────────────────────

/** facts.ts가 계산하는 값. null = 입력 모름 또는 해당 없음 */
export type FactValue = number | boolean | string | null;
export type Facts = Readonly<Record<string, FactValue>>;

// ───────────────────────── 조건 트리 ─────────────────────────

export type CompareOp = '<=' | '<' | '>=' | '>' | '==' | '!=';

/**
 * 날짜 기간 연산. value는 ISO 8601 기간(P7Y, P3M 등).
 * - withinPast:  asOf − 기간 ≤ 날짜 ≤ asOf   (예: 혼인기간 7년 이내)
 * - withinNext:  asOf ≤ 날짜 ≤ asOf + 기간   (예: 3개월 이내 결혼 예정)
 */
export type DateOp = 'withinPast' | 'withinNext';

export interface CompareCondition {
  id: string;
  label: string;
  fact: string;
  op: CompareOp;
  value: number | boolean | string;
}

export interface DateCondition {
  id: string;
  label: string;
  fact: string;
  op: DateOp;
  /** ISO 8601 기간 (PnYnMnD) */
  value: string;
}

export type Condition = CompareCondition | DateCondition;

/** 묶음 노드. 최상위 all의 자식이면 id/label을 붙여 체크리스트 한 줄로 보여 줍니다. */
export interface AllNode {
  id?: string;
  label?: string;
  all: ConditionNode[];
}
export interface AnyNode {
  id?: string;
  label?: string;
  any: ConditionNode[];
}
/** rule.definitions에 정의한 조건을 참조 */
export interface RefNode {
  id?: string;
  label?: string;
  ref: string;
}

export type ConditionNode = Condition | AllNode | AnyNode | RefNode;

// ───────────────────────── 한도 ─────────────────────────

/** 첫 번째로 when이 true인 선택지를 씁니다. when이 없으면 기본값입니다. */
export type LimitOption =
  { when?: ConditionNode; amount: Won } | { when?: ConditionNode; ratio: number; of: string };

/** 한도 항목 하나 (예: 호당 한도, LTV). 최종 한도는 모든 항목의 최솟값입니다. */
export interface LimitCap {
  id: string;
  label: string;
  options: LimitOption[];
}

export interface LimitSpec {
  caps: LimitCap[];
}

// ───────────────────────── 금리 ─────────────────────────

/** 금리표 열 구분: 대출기간(사용자 선택) 또는 fact 구간(예: 보증금) */
export type RateColumns =
  { kind: 'term'; years: number[] } | { kind: 'fact'; fact: string; upTo: (Won | null)[] };

export interface RateTable {
  /** 행 구분 fact (예: income.combined) */
  rowFact: string;
  /** 행 구간 상한(이하). 마지막 상한을 넘으면 표 밖 */
  rowUpTo: Won[];
  columns: RateColumns;
  /** rates[행][열], % 단위 */
  rates: number[][];
}

export interface RateAdjustment {
  id: string;
  label: string;
  when: ConditionNode;
  /** %p. 음수면 인하 */
  deltaPp: number;
}

/** 우대금리 항목. 첫 번째로 when이 true인 선택지 하나만 적용합니다. */
export interface RateDiscount {
  id: string;
  label: string;
  options: { when: ConditionNode; pp: number }[];
}

export interface RateSpec {
  table: RateTable;
  /** true면 소득 구간과 무관하게 표의 최고(마지막) 행을 씁니다. 예: 1인 소득 기준 신청 */
  topRowWhen?: ConditionNode;
  /** 기본금리 가감 (지방 −0.2%p, 1인 소득 +0.3%p 등) */
  adjustments: RateAdjustment[];
  discounts: RateDiscount[];
  /** 우대 합계 상한 */
  discountCap: { default: number; overrides: { when: ConditionNode; value: number }[] };
  /** 최종금리 하한 % */
  floor: number;
}

// ───────────────────────── 규칙 ─────────────────────────

export interface RuleSource {
  title: string;
  url: string;
  checkedAt: ISODate;
}

/**
 * 결과에 붙는 안내. when이 true이고 unless가 true가 아닐 때 보여 줍니다.
 * unless는 "확실히 충족한 게 아니면(false 또는 모름) 안내"할 때 씁니다. 예: 계약 체결 전 안내
 */
export interface RuleNote {
  id: string;
  when?: ConditionNode;
  unless?: ConditionNode;
  text: string;
}

export interface Rule {
  id: string;
  name: string;
  category: 'loan' | 'supply';
  effectiveFrom: ISODate;
  effectiveTo?: ISODate;
  source: RuleSource;
  /** 여러 곳에서 쓰는 조건 묶음. { ref: 이름 }으로 참조 */
  definitions?: Record<string, ConditionNode>;
  conditions: ConditionNode;
  limit?: LimitSpec;
  rate?: RateSpec;
  /** 조건이 true일 때 결과에 붙는 안내 */
  notes?: RuleNote[];
  /** 엔진이 판단하지 않고 항상 안내만 하는 항목 (신용도 등) */
  manualChecks: string[];
}

export interface RuleSet {
  version: string;
  rules: Rule[];
}

// ───────────────────────── 결과 ─────────────────────────

/** true = 충족, false = 미충족, null = 입력 모름 */
export type Truth = boolean | null;

export type Status = 'eligible' | 'ineligible' | 'needs_check';

export interface Check {
  conditionId: string;
  label: string;
  passed: Truth;
  actual?: FactValue;
  required?: unknown;
}

export interface RateQuote {
  termYears?: number;
  /** 표 금리 + 가감(지방, 1인 소득 등) */
  baseRate: number;
  /** 상한 적용한 우대 합계 */
  discount: number;
  /** max(하한, baseRate − discount) */
  finalRate: number;
}

export interface Result {
  ruleId: string;
  status: Status;
  checks: Check[];
  estimatedLimit?: Won;
  rateRange?: { min: number; max: number };
  notes: string[];
  manualChecks: string[];
}

export interface EvalOptions {
  /** 판정 기준일 */
  asOf: ISODate;
}
