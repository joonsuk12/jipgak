# 아키텍처

## 1. 실행 구조

```
[사용자 기기: 모바일 웹 / Android / iOS — 같은 React 코드]
  화면(React) ──► 판정 엔진(TS, rules-engine)
       │                 ▲ 규칙
       ▼                 │
  데이터 어댑터(src/data) ── 로컬 저장소 (내 조건, 규칙 캐시, 앱 내장 기본 규칙)
       │
       ├─ features.X = "static" (기본) ─► 정적 호스팅 (Cloudflare Pages)
       │                                   /, /rules/*.json, /config.json, /guide/*
       └─ features.X = "api"            ─► FastAPI (/api/*)  ── 실패 시 static으로 폴백

[GitHub + CI]   규칙 JSON PR → 스키마 검사 + 골든 테스트 → rules 번들 + manifest 배포
[notice-job]    (v3) Python, GitHub Actions 예약 실행: 공고 수집 → FCM 주제 푸시
[외부 서비스]    분석(GA4 / Firebase, 입력값 제외), 광고(AdSense / AdMob), 푸시(FCM)
```

**원칙**
1. 판정은 항상 기기에서 합니다. 서버는 판정하지 않으므로 엔진 구현은 하나뿐입니다.
2. 규칙은 데이터입니다. 정책이 바뀌면 JSON만 수정합니다.
3. 토글은 기능 단위로 둡니다. 전체를 한 번에 켜고 끄는 스위치는 두지 않습니다.
4. 실패하면 열어 둡니다(fail-open). 원격 실패 → 캐시 → 앱 내장 기본본 순서로 폴백합니다.

## 2. 저장소 구조

```
jipgak/
├─ CLAUDE.md
├─ docs/                      PLAN, ARCHITECTURE, DECISIONS, STATUS, golden-cases, sources/
├─ packages/
│  ├─ rules-engine/           @jipgak/rules-engine (TS 순수 로직)
│  │  ├─ src/types.ts         UserProfile, Rule, Condition, Result
│  │  ├─ src/facts.ts         프로필 → 파생값(facts) 계산
│  │  ├─ src/evaluate.ts      조건 트리 평가
│  │  ├─ src/limit.ts         한도·금리 계산
│  │  ├─ src/whatif.ts        (v2) 반사실 시뮬레이션
│  │  └─ test/                golden.test.ts 등
│  └─ rules-data/             @jipgak/rules-data
│     ├─ schema.json          규칙 JSON Schema
│     ├─ products/*.json      상품별 규칙
│     └─ build.ts             번들 + manifest.json(버전, 해시)
├─ apps/mobile-web/           React + Vite + Tailwind (+ Capacitor는 v2)
│  └─ src/
│     ├─ screens/
│     ├─ data/                sources.ts · static/ · api/(빈 자리) · factory.ts
│     └─ platform/            storage(구현됨, D-22) · notify · share (web / native)
├─ public-config/config.json
├─ services/                  (v3) notice-job/, api/ — Python
├─ tools/rule-drafter/        (v1 이후) 공고문 → 규칙 JSON 초안 (Python + LLM)
└─ content/                   해설 글 (v1)
```

## 3. 데이터 모델

> v0에서 `packages/rules-engine/src/types.ts`로 확정했습니다. **기준은 types.ts**이고, 아래는 처음 초안입니다. 초안과 달라진 점:
> - `household.hasMortgageOrJeonseLoan` → `hasMortgageLoan` / `hasJeonseLoan`으로 분리 (구입자금은 은행 전세대출을 막지 않음)
> - `purchase`·`jeonse`에 `contractSigned`(계약 체결 여부) 추가, 금액·면적은 선택 입력
> - `Region.metro`도 선택 입력(지역 모름 허용)
> - 조건 노드: 날짜 기간 연산 `withinPast`/`withinNext`(값은 `P7Y` 같은 ISO 8601 기간), 묶음 노드에 `id`/`label`, `rule.definitions` + `{ ref }` 참조 추가
> - 판정은 3값 논리(Kleene): `all`은 false가 하나라도 있으면 false, `any`는 true가 하나라도 있으면 true. 상태는 최상위 조건 트리의 결과로 정하고, `checks`는 최상위 `all`의 자식 하나당 한 줄입니다.
> - `limit`: 항목(cap)별로 `options` 중 처음 `when`이 true인 값(금액 또는 fact × 비율)을 고르고, 항목들의 최솟값이 한도입니다. 부적격이면 한도를 계산하지 않습니다.
> - `rate`: 금리표(행 = 소득 fact 구간, 열 = 대출기간 또는 fact 구간) + `topRowWhen`(1인 소득 기준 → 최고 행) + 가감(`adjustments`) + 우대(`discounts`, 항목별 1개, 합계 상한) + 하한(`floor`)


```ts
type Won = number;           // 원 단위 정수
type ISODate = string;       // 'YYYY-MM-DD'

interface Person {
  birthDate?: ISODate;
  annualIncome?: Won;        // 연소득. undefined = 모름
}

interface UserProfile {
  applicant: Person;                       // 대출 신청인
  spouse?: Person;
  marriage: { status: 'planned' | 'married'; date?: ISODate };  // planned면 예정일, married면 혼인신고일
  netAssets?: Won;                         // 부부합산 순자산
  household: {
    allHomeless?: boolean;                 // 세대원 전원 무주택
    everOwnedHome?: boolean;               // 생애최초 판정용
    hasFundLoan?: boolean;                 // 기금대출 이용 중
    hasMortgageOrJeonseLoan?: boolean;     // 은행 주담대 / 전세대출 이용 중
    livesInPublicRental?: boolean;
  };
  children?: { birthDate: ISODate }[];
  subscription?: { joinedAt: ISODate; paymentCount: number };
  purchase?: { region: Region; price: Won; areaM2: number; contractDate?: ISODate };
  jeonse?:   { region: Region; deposit: Won; areaM2: number; contractDate?: ISODate };
}

type Region = { metro: boolean; regulated?: boolean; ruralTownship?: boolean };
// metro = 수도권(서울·인천·경기)

interface Condition {
  id: string; label: string;
  fact: string;                            // facts.ts가 계산하는 키
  op: '<=' | '<' | '>=' | '>' | '==' | '!=';
  value: number | boolean | string;
}
type ConditionNode = Condition | { all: ConditionNode[] } | { any: ConditionNode[] };

interface Rule {
  id: string; name: string; category: 'loan' | 'supply';
  effectiveFrom: ISODate; effectiveTo?: ISODate;
  source: { title: string; url: string; checkedAt: ISODate };
  conditions: ConditionNode;
  limit?: unknown;                         // v0에서 구조 확정 (호당 한도, LTV, 비율)
  rate?: unknown;                          // v0에서 구조 확정 (소득 × 기간/보증금 표)
  manualChecks: string[];                  // 엔진이 판단하지 않고 항상 안내만 하는 항목 (신용도 등)
}

type Status = 'eligible' | 'ineligible' | 'needs_check';

interface Result {
  ruleId: string; status: Status;
  checks: { conditionId: string; label: string; passed: boolean | null; actual?: unknown; required?: unknown }[];
  estimatedLimit?: Won;
  rateRange?: { min: number; max: number };
  notes: string[];                         // 예: "1인 소득 기준 적용, 금리 +0.3%p"
  manualChecks: string[];
}
```

**판정 규칙**
- 조건 하나라도 `false`이면 → `ineligible`
- `false`는 없고 하나라도 `null`(입력 모름)이면 → `needs_check`
- 모두 `true`이면 → `eligible`
- `manualChecks`는 상태에 영향을 주지 않고 항상 함께 표시합니다.

모든 판정 함수는 `evaluate(rule, profile, { asOf })` 형태입니다. 혼인기간, 결혼 예정 3개월 같은 날짜 계산은 `asOf` 기준으로 합니다.

## 4. 데이터 어댑터와 토글

```ts
// apps/mobile-web/src/data/sources.ts
interface RulesSource  { getRuleSet(): Promise<RuleSet> }
interface ConfigSource { getConfig(): Promise<Config> }
// (v3) NoticeSource, (필요 시) ProfileSyncSource

// factory.ts
createRulesSource(cfg) =
  cfg.features.rules === 'api'
    ? withFallback(new ApiRulesSource(cfg.apiBaseUrl), new StaticRulesSource())
    : new StaticRulesSource();
```

```json
// public-config/config.json
{
  "apiBaseUrl": "/api",
  "features": { "rules": "static", "notices": "off", "profileSync": "off", "ads": "off" }
}
```

## 5. 규칙 배포 흐름

1. 원문 변경 → `docs/sources/*.md` 수정 → `products/*.json` 수정 → PR
2. CI: 스키마 검사 → 골든 테스트 → `rules-<version>.json` + `manifest.json` 빌드
3. 정적 호스팅 배포
4. 클라이언트: 시작 시 manifest 확인 → 새 버전이면 받아서 캐시. 실패하면 캐시 또는 내장본 사용

## 6. URL 구성 (도메인 연결 후)

```
jipgak.kr/             웹 앱
jipgak.kr/rules/...    규칙 번들 + manifest
jipgak.kr/config.json  토글
jipgak.kr/guide/...    해설 글
jipgak.kr/api/...      (나중) FastAPI — 같은 도메인으로 두어 CORS 회피
```
