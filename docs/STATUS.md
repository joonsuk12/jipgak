# 진행 상황

> 세션을 시작하면 이 파일부터 읽고, 끝날 때 갱신합니다.

## 현재 단계: v0 완료 (2026-11-18). 다음은 v1

## 완료
- [x] 기획·아키텍처·결정 문서 작성 (2026-11-17)
- [x] v1 대상 2개 상품 공식 출처 요약 (`docs/sources/`, 2026-11-17 확인)
- [x] 골든 케이스 초안 (`docs/golden-cases.md`) — 사용자 검토 필요
- [x] 판정 테스트 화면 (2026-11-18): `apps/mobile-web/src/screens/playground/`. 골든 케이스 프리셋을 불러와 입력을 바꾸면 즉시 다시 판정. 프리셋 = 골든 기대값 테스트 포함. `pnpm --filter @jipgak/mobile-web dev`로 실행
- [x] 사용자 검토 항목 정리: `docs/REVIEW.md`
- [x] 계약 체결·전세 담보별 한도를 "가능 + 안내"로 변경 (D-15, 2026-11-18). 골든 P13·J11 추가
- [x] 용어집 `docs/GLOSSARY.md` (2026-11-18): 개념 설명만, 정책 수치는 sources 참조. 화면 도움말 원본
- [x] v0 (2026-11-17~18): 모노레포, 엔진(`types`·`dates`·`facts`·`conditions`·`evaluate`·`limit`), 규칙 스키마와 상품 규칙 2개, 골든 테스트(P·J·R 전부 통과, 모순으로 보류한 케이스 없음), mobile-web 뼈대와 데이터 어댑터, `public-config/config.json`, CI

## 다음 할 일 (v1, 위에서부터 순서대로)
1. [ ] 사용자 검토 반영: `docs/REVIEW.md`의 남은 B·C 항목. 결정은 DECISIONS로 옮김 (A 항목은 D-15로 완료)
2. [ ] GitHub 원격 레포 push 후 CI 첫 실행 확인 (로컬에서는 같은 명령이 모두 통과, Actions에서는 아직 실행 전)
3. [ ] `rules-data/build.ts`: 규칙 번들 `rules-<version>.json` + `manifest.json`(버전, 해시) 생성, `StaticRulesSource`에 manifest 확인·로컬 캐시 추가
4. [ ] 화면: 목적 선택 → 입력 위저드("모름" 허용) → 결과 목록 → 상세(조건별 체크리스트, 근거 링크, 예상 한도·금리 범위)
5. [ ] 화면 용어 도움말 (D-16): 헷갈리는 항목 아래 한 줄 안내 + "자세히"로 상세 펼침. 먼저 GLOSSARY에 용어별 "한 줄 안내"를 추가하고, 화면용 데이터(`content/glossary`)로 옮김. 우선 대상: 전용면적(평 아님), 혼인신고일 기준, 순자산, 세대원 전원 무주택, 생애최초, %p
6. [ ] `src/platform/storage` (입력값은 기기에만 저장)
7. [ ] Cloudflare Pages 배포(`*.pages.dev`), 면책 문구, 개인정보 처리방침, 분석(입력값 제외)

## 다음 세션 메모
- pnpm은 `corepack enable pnpm --install-directory "$APPDATA/npm"`로 설치함 (Program Files 쓰기 권한 없음). pnpm 12.21.0
- TypeScript는 6.0으로 고정 (typescript-eslint가 TS 7 미지원). Vite 8, Vitest 5, Tailwind 4, ESLint 10
- 골든 테스트 기본 프로필: 계약 체결(상태에는 영향 없음, D-15), 지방 케이스는 `regulated: false`, R 케이스는 `computeRate(...).baseRate`로 검증, J09는 합산 5,000을 3,000+2,000으로 나눔
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
- "민법상 성년 세대주"는 소스에 나이 수치가 없어 조건 대신 `manualChecks`로 안내
- 생애최초의 "기금 구입·중도금 대출 이력 없음"은 입력 항목이 없어 `manualChecks`로 안내
- 우대금리 "다자녀"를 3자녀 이상으로 해석 (1자녀·2자녀가 따로 있어서)
- 계약일을 모르면 2025-06-27 이후 계약(현행 호당 한도)으로 계산
