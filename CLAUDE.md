# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 집각 (jipgak)

신혼·예비부부용 정책 대출(이후 청약 특별공급) 자격 판정 서비스입니다. 판정은 기기 안의 TS 엔진이 하고, 정책 조건은 JSON 규칙 데이터로 관리합니다. 배포는 정적 호스팅이 기본이며, 기능별 토글로 온라인 서버 모드로 전환할 수 있습니다.

## 세션 시작 시 읽을 순서

1. `docs/STATUS.md`: 현재 단계와 다음 할 일. **항상 먼저 읽기**
2. 작업에 필요한 문서만 골라 읽기
   - 구조나 인터페이스를 다룰 때: `docs/ARCHITECTURE.md`
   - 왜 이렇게 정했는지 궁금할 때: `docs/DECISIONS.md` (여기 있는 결정은 다시 논의하지 않음)
   - 규칙값이 필요할 때: `docs/sources/*.md` (원문 웹페이지·PDF는 출처 재검증 때만 읽음, D-17)
   - 테스트 기대값: `docs/golden-cases.md` (사람용 요약: `docs/TEST-CASES.md`, 골든 케이스를 바꾸면 같이 갱신)
   - 부동산·대출 용어 뜻: `docs/GLOSSARY.md` (화면 도움말 문구의 원본)
   - 사용자 결정 대기 항목: `docs/REVIEW.md`
   - 제품 범위와 로드맵: `docs/PLAN.md`

## 명령

```bash
corepack enable pnpm --install-directory "$APPDATA/npm"   # pnpm이 없을 때 최초 1회 (Windows, 관리자 권한 없이)
pnpm install
pnpm test                # 전체 테스트 (vitest, 골든 케이스 포함)
pnpm --filter @jipgak/rules-engine test
pnpm --filter @jipgak/rules-data validate   # 규칙 JSON 스키마 검사
pnpm lint                # ESLint + Prettier 검사
pnpm format              # Prettier 자동 정리
pnpm typecheck           # tsc --noEmit (패키지별)
pnpm build               # mobile-web 빌드
pnpm --filter @jipgak/mobile-web dev        # 개발 서버
```

테스트 하나만 돌릴 때:

```bash
pnpm --filter @jipgak/rules-engine exec vitest run test/golden.test.ts   # 파일 하나
pnpm --filter @jipgak/rules-engine exec vitest run -t "P01"             # 이름으로 (골든 케이스 ID)
```

패키지는 빌드하지 않고 TS 소스(`main: src/index.ts`)를 그대로 가져다 씁니다. `pnpm build`는 mobile-web만 빌드합니다. CI(`.github/workflows/ci.yml`)는 스키마 검사 → lint → typecheck → test → build 순서로 돌립니다.

## 구조 한눈에

- **판정 흐름:** `UserProfile` → `computeFacts`(`facts.ts`, 키 목록 `FACT_KEYS`) → 규칙 JSON 조건이 fact 키를 참조 → `evaluateNode`(`conditions.ts`, 3값 논리 true/false/null=모름) → `evaluate.ts`가 루트 조건 결과로 상태를 정하고, 루트 `all`의 자식 하나당 `checks` 한 줄 → 불가가 아니면 `limit.ts`가 한도·금리 계산
- **새 입력 추가:** `types.ts`(UserProfile) → `facts.ts`(FACT_KEYS + computeFacts) → 규칙 JSON. 규칙이 모르는 fact를 쓰면 `test/engine.test.ts`가 잡습니다.
- **규칙 JSON 문법** (스키마 원본 `packages/rules-data/schema.json`)
  - `definitions` + `{ "ref": 이름 }`으로 공통 조건 재사용
  - 날짜 조건 `withinPast`·`withinNext`, 값은 ISO 기간(`P7Y`, `P3M`)
  - `notes`의 `when`·`unless`: 사용자가 미리 알 수 없는 신청 요건(계약 체결 등)은 상태 대신 안내로 표시(D-15)
  - `limit.caps[].options`: 처음 `when`이 true인 선택지(금액 또는 fact × 비율). 한도는 cap들의 최솟값
  - `rate`: 금리표 + `topRowWhen`(1인 소득 → 최고 행) + 가감 + 우대(항목별 1개, 합계 상한) + 하한
- **의존 방향:** rules-data는 엔진에 의존하지 않습니다(순환 방지). `products`는 `unknown[]`이라 쓰는 쪽에서 `as Rule[]`로 바꿉니다. 엔진은 골든 테스트용으로 rules-data를 devDependency로 둡니다.
- **mobile-web:** 기본 경로(`/`)는 입력 위저드(`screens/wizard/`: 답 모델 `answers.ts` → `toProfile()` → 엔진), `/#/dev`는 개발용 판정 화면입니다. 결과 카드는 `components/ResultCard.tsx` 하나를 같이 씁니다. 답은 `answersStore.ts`가 `src/platform/storage.ts`를 통해 기기에만 저장합니다(D-22). 규칙은 `src/data/useRuleSet.ts` 훅으로 받고, 이 훅은 `src/data/factory.ts`로 데이터 출처를 고릅니다(static 기본, api는 빈 자리 + `withFallback`). `/config.json`은 vite `publicDir: ../../public-config`에서 서빙합니다. `screens/playground/`는 개발용 판정 화면이고, 프리셋 결과는 `test/playground.test.ts`가 골든 기대값과 대조합니다.
- **단위:** 금액은 원 단위 정수입니다. 골든 문서는 만 원 단위라 테스트에서 `man()`으로 바꿉니다. 금리는 내부에서 bp 정수로 계산합니다.
- **TS 주의:** `exactOptionalPropertyTypes` 때문에 "모름"은 `undefined`를 넣지 말고 키를 빼서 표현합니다(테스트의 `without*` 함수, `playground/form.ts`의 `compact`). TypeScript는 6.0 고정(D-14).
- **엔진 순수성은 린트가 강제합니다:** `packages/rules-engine/src`에서 `Date.now()`, 인자 없는 `new Date()`, `fetch`·`window`·`document`·`localStorage` 금지(`eslint.config.js`).


## 규칙

- **TypeScript strict.** 식별자·파일명은 영어, 화면 문구와 규칙 `label`은 한국어로 씁니다.
- **`packages/rules-engine`은 순수 함수만 둡니다.** 네트워크, DOM, 플랫폼 API, `Date.now()` 직접 호출 금지. 기준일은 `asOf` 인자로 받습니다.
- **정책 수치는 `docs/sources/`에 있는 값만 씁니다.** 없는 값을 추측하거나 만들어 내지 않습니다. 필요하면 STATUS에 "확인 필요"로 남깁니다.
- 규칙 JSON을 수정하면 해당 `docs/sources/*.md`와 골든 케이스도 같은 커밋에서 맞춥니다.
- 화면 코드는 `src/data/sources.ts` 인터페이스만 의존합니다. `fetch`를 화면에서 직접 호출하지 않습니다.
- 사용자 입력값(소득, 자산 등)은 서버 전송, 로그, 분석 이벤트에 절대 포함하지 않습니다.
- 서버 모드(`api`) 구현은 해당 단계 전까지 만들지 않습니다. 인터페이스만 둡니다.
- 진행사항은 작업 도중에도 `docs/STATUS.md`에 갱신하고 커밋합니다. 중단되더라도 다음 세션이 바로 이어받을 수 있게 합니다.

## 스킬

- **화면(UI) 작업:** 새 화면을 만들거나 기존 화면을 바꿀 때는 `frontend-design` 스킬을 먼저 불러옵니다. 비슷한 `design-taste-frontend`는 쓰지 않습니다.
- **출처 재검증·규칙 수정:** `.claude/skills/rule-update` 절차를 따릅니다.
- **점검:** 단계를 마칠 때 `/code-review`, 배포 전에는 `/security-review`를 실행합니다(입력값 무전송 원칙 확인).

## 토큰 절약 수칙

- `node_modules/`, `dist/`, `android/`, `ios/`, `*.lock`은 읽거나 검색하지 않습니다.
- 맞는지 추론하기보다 테스트를 실행해서 확인합니다. 출력이 길면 실패한 부분만 봅니다.
- 한 세션에 작업 하나만 합니다. 끝나면 `docs/STATUS.md`의 "완료"와 "다음 할 일"을 갱신하고 커밋합니다.
- 새 결정을 내리면 `docs/DECISIONS.md`에 한 항목으로 추가합니다.

## 커밋

- 작은 단위로 커밋하고, 메시지는 한국어 한 줄 요약으로 씁니다. 예: `rules-engine: 소득 조건 평가 추가`
- 회사 코드나 내부 정보는 레포에 넣지 않습니다.
