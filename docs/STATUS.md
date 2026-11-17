# 진행 상황

> 세션을 시작하면 이 파일부터 읽고, 끝날 때 갱신합니다.

## 현재 단계: v0 착수 전

## 완료
- [x] 기획·아키텍처·결정 문서 작성 (2026-11-17)
- [x] v1 대상 2개 상품 공식 출처 요약 (`docs/sources/`, 2026-11-17 확인)
- [x] 골든 케이스 초안 (`docs/golden-cases.md`) — 사용자 검토 필요

## 다음 할 일 (v0, 위에서부터 순서대로)
1. [ ] 모노레포 초기화: pnpm workspaces, TS strict, Vitest, ESLint/Prettier, `.editorconfig`
2. [ ] `packages/rules-engine/src/types.ts` 확정 (`docs/ARCHITECTURE.md` §3 기준)
3. [ ] `packages/rules-data/schema.json` + 상품 규칙 2개(`loan-newlywed-purchase`, `loan-newlywed-jeonse`)
4. [ ] `facts.ts` / `evaluate.ts` / `limit.ts` 구현
5. [ ] 골든 테스트: `docs/golden-cases.md`의 케이스를 `test/golden.test.ts`로 옮기고 전부 통과
6. [ ] `apps/mobile-web` 뼈대: Vite + React + Tailwind, `src/data/` 어댑터(인터페이스 + static + factory + withFallback), `public-config/config.json`
7. [ ] CI: GitHub Actions에서 lint, test, 규칙 스키마 검사

## 사용자 TODO
- [ ] KIPRIS 상표 검색으로 "집각" 확인
- [ ] `jipgak.kr` 또는 `jipgak.com` 도메인 구매
- [ ] 골든 케이스 기대값 검토
- [ ] GitHub 원격 레포 생성 (비공개 권장) 후 push

## 확인 필요 (정책·규칙)
- 구입자금의 "만 30세 미만 단독세대주 제외"는 신혼·예비부부에게 해당하지 않는 것으로 보고 v1에서 생략
- 구입자금 DTI 60%는 부채 입력이 없어 v1에서 `manualChecks`로 처리
