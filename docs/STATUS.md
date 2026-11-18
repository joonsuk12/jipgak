# 진행 상황

> 세션을 시작하면 이 파일부터 읽고, 끝날 때 갱신합니다.

## 현재 단계: v0 완료 (2026-11-18). 다음은 v1

## 완료
- [x] 기획·아키텍처·결정 문서 작성 (2026-11-17)
- [x] v1 대상 2개 상품 공식 출처 요약 (`docs/sources/`, 2026-11-17 확인)
- [x] 골든 케이스 초안 (`docs/golden-cases.md`) — 사용자 검토 필요
- [x] 판정 테스트 화면 (2026-11-18): `apps/mobile-web/src/screens/playground/`. 골든 케이스 프리셋을 불러와 입력을 바꾸면 즉시 다시 판정. 프리셋 = 골든 기대값 테스트 포함. `pnpm --filter @jipgak/mobile-web dev`로 실행
- [x] 사용자 검토 항목 정리: `docs/REVIEW.md`
- [x] v0 (2026-11-17~18): 모노레포, 엔진(`types`·`dates`·`facts`·`conditions`·`evaluate`·`limit`), 규칙 스키마와 상품 규칙 2개, 골든 테스트(P·J·R 전부 통과, 모순으로 보류한 케이스 없음), mobile-web 뼈대와 데이터 어댑터, `public-config/config.json`, CI

## 다음 할 일 (v1, 위에서부터 순서대로)
1. [ ] 사용자 검토 반영: `docs/REVIEW.md`의 A 항목(1-1 계약 전 판정, 2-1 전세 담보별 한도)부터. 결정은 DECISIONS로 옮김
2. [ ] GitHub 원격 레포 push 후 CI 첫 실행 확인 (로컬에서는 같은 명령이 모두 통과, Actions에서는 아직 실행 전)
3. [ ] `rules-data/build.ts`: 규칙 번들 `rules-<version>.json` + `manifest.json`(버전, 해시) 생성, `StaticRulesSource`에 manifest 확인·로컬 캐시 추가
4. [ ] 화면: 목적 선택 → 입력 위저드("모름" 허용) → 결과 목록 → 상세(조건별 체크리스트, 근거 링크, 예상 한도·금리 범위)
5. [ ] `src/platform/storage` (입력값은 기기에만 저장)
6. [ ] Cloudflare Pages 배포(`*.pages.dev`), 면책 문구, 개인정보 처리방침, 분석(입력값 제외)

## 다음 세션 메모
- pnpm은 `corepack enable pnpm --install-directory "$APPDATA/npm"`로 설치함 (Program Files 쓰기 권한 없음). pnpm 12.21.0
- TypeScript는 6.0으로 고정 (typescript-eslint가 TS 7 미지원). Vite 8, Vitest 5, Tailwind 4, ESLint 10
- 골든 테스트 기본 프로필: `contractSigned: true`, 지방 케이스는 `regulated: false`, R 케이스는 `computeRate(...).baseRate`로 검증, J09는 합산 5,000을 3,000+2,000으로 나눔
- 엔진 린트 규칙: `packages/rules-engine/src`에서 `Date.now()`, 인자 없는 `new Date()`, `fetch`·`window`·`document`·`localStorage` 금지

## 사용자 TODO
- [ ] KIPRIS 상표 검색으로 "집각" 확인
- [ ] `jipgak.kr` 또는 `jipgak.com` 도메인 구매
- [ ] 골든 케이스 기대값 검토
- [ ] GitHub 원격 레포 생성 (비공개 권장) 후 push

## 확인 필요 (정책·규칙)

> 선택지와 우선순위까지 정리한 목록은 `docs/REVIEW.md`에 있습니다.

- 구입자금의 "만 30세 미만 단독세대주 제외"는 신혼·예비부부에게 해당하지 않는 것으로 보고 v1에서 생략
- 구입자금 DTI 60%는 부채 입력이 없어 v1에서 `manualChecks`로 처리
- 전세자금 "담보별 한도"는 소스에 `needs_check`로 안내한다고 되어 있으나, 골든 J01이 eligible이므로 DTI와 같게 `manualChecks`로 처리
- 골든 "공통 기본값"에 매매·임대차 계약 체결 여부가 없음 → 테스트 기본 프로필은 계약 체결(`contractSigned: true`)로 가정. 계약 전 판정을 어떻게 보여 줄지(제품 결정) 확인 필요
- "민법상 성년 세대주"는 소스에 나이 수치가 없어 조건 대신 `manualChecks`로 안내
- 생애최초의 "기금 구입·중도금 대출 이력 없음"은 입력 항목이 없어 `manualChecks`로 안내
- 우대금리 "다자녀"를 3자녀 이상으로 해석 (1자녀·2자녀가 따로 있어서)
- 계약일을 모르면 2025-06-27 이후 계약(현행 호당 한도)으로 계산
