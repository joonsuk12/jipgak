# 진행 상황

> 세션을 시작하면 이 파일부터 읽고, 끝날 때 갱신합니다.

## 현재 단계: v0 진행 중 (4번 엔진 구현 도중 중단, 2026-11-17)

## 완료
- [x] 기획·아키텍처·결정 문서 작성 (2026-11-17)
- [x] v1 대상 2개 상품 공식 출처 요약 (`docs/sources/`, 2026-11-17 확인)
- [x] 골든 케이스 초안 (`docs/golden-cases.md`) — 사용자 검토 필요

## 다음 할 일 (v0, 위에서부터 순서대로)
1. [x] 모노레포 초기화: pnpm workspaces, TS strict, Vitest, ESLint/Prettier, `.editorconfig`
2. [x] `packages/rules-engine/src/types.ts` 확정 (`docs/ARCHITECTURE.md` §3 기준)
3. [x] `packages/rules-data/schema.json` + 상품 규칙 2개(`loan-newlywed-purchase`, `loan-newlywed-jeonse`)
4. [ ] `facts.ts` / `evaluate.ts` / `limit.ts` 구현 — **진행 중 (WIP 커밋)**
   - 완료: `dates.ts`(ISO 날짜·기간 계산), `facts.ts`(FACT_KEYS, computeFacts), `conditions.ts`(3값 논리 평가), `evaluate.ts`(evaluate/evaluateAll/isEffective)
   - 남은 일:
     - `conditions.ts` compare의 `<,<=,>,>=`가 boolean 유니온 때문에 tsc 오류 → `==`/`!=` 먼저 처리하고, boolean이면 throw, 나머지는 `[number,number] | [string,string]`로 좁혀 비교
     - `limit.ts` 작성: `computeLimit(spec, ctx)`(cap마다 첫 번째 `when`이 true인 option, 금액 또는 `floor(fact × ratio + 1e-6)`, 계산 불가 cap이 있으면 undefined, 결과는 cap 최솟값), `computeRate(spec, ctx, termYears?)`(bp 정수 계산, topRowWhen이면 마지막 행, 가감 합산, 우대는 항목별 첫 true option 합계를 cap으로 제한, floor 적용), `computeRateRange`(term 열이면 전체 기간의 min/max, fact 열이면 단일값)
     - `src/index.ts`에서 공개 API export, `pnpm typecheck`·`pnpm lint`(prettier 포함) 통과시키기, `test/smoke.test.ts` 삭제
5. [ ] 골든 테스트: `docs/golden-cases.md`의 케이스를 `test/golden.test.ts`로 옮기고 전부 통과
6. [ ] `apps/mobile-web` 뼈대: Vite + React + Tailwind, `src/data/` 어댑터(인터페이스 + static + factory + withFallback), `public-config/config.json`
7. [ ] CI: GitHub Actions에서 lint, test, 규칙 스키마 검사

## 다음 세션 메모
- pnpm은 `corepack enable pnpm --install-directory "$APPDATA/npm"`로 설치함 (Program Files 쓰기 권한 없음). pnpm 12.21.0
- TypeScript는 6.0으로 고정 (typescript-eslint가 TS 7 미지원)
- 골든 테스트 작성 시: 기본 프로필에 `contractSigned: true`, 지방 케이스는 `regulated: false`, R 케이스는 `computeRate`의 `baseRate`로 검증. J09는 합산 5,000을 3,000+2,000으로 나눔
- 4번 끝나면 5→6→7 순서 그대로, 끝나면 CLAUDE.md 명령 목록(`pnpm typecheck`, `pnpm --filter @jipgak/rules-data validate` 추가) 갱신

## 사용자 TODO
- [ ] KIPRIS 상표 검색으로 "집각" 확인
- [ ] `jipgak.kr` 또는 `jipgak.com` 도메인 구매
- [ ] 골든 케이스 기대값 검토
- [ ] GitHub 원격 레포 생성 (비공개 권장) 후 push

## 확인 필요 (정책·규칙)
- 구입자금의 "만 30세 미만 단독세대주 제외"는 신혼·예비부부에게 해당하지 않는 것으로 보고 v1에서 생략
- 구입자금 DTI 60%는 부채 입력이 없어 v1에서 `manualChecks`로 처리
- 전세자금 "담보별 한도"는 소스에 `needs_check`로 안내한다고 되어 있으나, 골든 J01이 eligible이므로 DTI와 같게 `manualChecks`로 처리
- 골든 "공통 기본값"에 매매·임대차 계약 체결 여부가 없음 → 테스트 기본 프로필은 계약 체결(`contractSigned: true`)로 가정. 계약 전 판정을 어떻게 보여 줄지(제품 결정) 확인 필요
- "민법상 성년 세대주"는 소스에 나이 수치가 없어 조건 대신 `manualChecks`로 안내
- 생애최초의 "기금 구입·중도금 대출 이력 없음"은 입력 항목이 없어 `manualChecks`로 안내
- 우대금리 "다자녀"를 3자녀 이상으로 해석 (1자녀·2자녀가 따로 있어서)
- 계약일을 모르면 2025-06-27 이후 계약(현행 호당 한도)으로 계산
