# 진행 상황

> 세션을 시작하면 이 파일부터 읽고, 끝날 때 갱신합니다.

## 현재 단계: v0 완료 (2026-11-18). 다음은 v1 (검토 항목 확정 → 화면)

## 완료
- [x] 기획·아키텍처·결정 문서 작성 (2026-11-17)
- [x] v1 대상 2개 상품 공식 출처 요약 (`docs/sources/`, 2026-11-17 확인)
- [x] 골든 케이스 초안 (`docs/golden-cases.md`) — 사용자 검토 필요
- [x] 판정 테스트 화면 (2026-11-18): `apps/mobile-web/src/screens/playground/`. 골든 케이스 프리셋을 불러와 입력을 바꾸면 즉시 다시 판정. 프리셋 = 골든 기대값 테스트 포함. `pnpm --filter @jipgak/mobile-web dev`로 실행
- [x] 사용자 검토 항목 정리: `docs/REVIEW.md`
- [x] 계약 체결·전세 담보별 한도를 "가능 + 안내"로 변경 (D-15, 2026-11-18). 골든 P13·J11 추가
- [x] 집 크기를 평형 중심으로 표시 (D-25, 2026-11-24): 25·30·34평형 버튼이 먼저, 전용면적 직접 입력은 보조. 평형 기준값은 `screens/wizard/areaTypes.ts` 한 곳
- [x] 면적 입력 도움 (D-23, 2026-11-24): 흔한 크기 59·74·84㎡ 버튼, 전용 평 → ㎡ 변환기, 입력한 ㎡의 평 환산 표시. `screens/wizard/AreaField.tsx`, 변환 함수 `format.ts`(`pyeongToM2`)
- [x] v1 코드 리뷰 반영 (2026-11-24): 8건 수정 — 면적 소수점(84.97) 입력, 불가 결과엔 안내 문구 없음(엔진), 결과 판정 오류 시 화면 유지, 미래 혼인신고일 경고, 이어 하기 안내를 복원된 단계에 표시·단계 범위 보정, 계산서 합계와 순자산 칸 불일치 안내, hasAnyAnswer 키 순서 무관, 용어집 파서 정리. 테스트 113개
- [x] 테스트 전체 재점검 (2026-11-23): 72개 기대값을 원문 기준으로 다시 계산 → 71개 일치, J12 1건 오류(지역 모르면 보증금 3억도 "확인 필요"로 봄) → 전세 보증금 조건 재표현, J12 수정·J13 추가. 한눈에 보기 문서 `docs/TEST-CASES.md`
- [x] 검토 B 항목 확정 (D-19, 2026-11-23): 기금 구입·중도금 대출 이력 입력 추가(골든 P14), 규제지역 모름 안내 추가(골든 P15)
- [x] 순자산 계산 도우미 넣기로 결정 (D-18, 2026-11-18). 사양은 아래 "다음 할 일" 6번
- [x] 원문 재검증 (2026-11-18, D-17): 두 상품 수치 모두 일치. 소득·순자산·다자녀 산정 기준을 `docs/sources/income-and-assets.md`로 추가, 골든 케이스에 원문 근거 표 추가
- [x] 용어집 `docs/GLOSSARY.md` (2026-11-18): 용어별 💬 한 줄 안내 + 상세 설명 + 개발자 메모. ★ = 화면에 항상 표시. 정책 수치는 sources 참조
- [x] v0 (2026-11-17~18): 모노레포, 엔진(`types`·`dates`·`facts`·`conditions`·`evaluate`·`limit`), 규칙 스키마와 상품 규칙 2개, 골든 테스트(P·J·R 전부 통과, 모순으로 보류한 케이스 없음), mobile-web 뼈대와 데이터 어댑터, `public-config/config.json`, CI

## 다음 할 일 (v1, 위에서부터 순서대로)
1. [x] 사용자 검토 반영: A 항목(D-15), B 항목(D-19) 완료. 남은 C 항목은 화면 작업하며 처리
2. [ ] GitHub 원격 레포 push 후 CI 첫 실행 확인 (로컬에서는 같은 명령이 모두 통과, Actions에서는 아직 실행 전)
3. [ ] `rules-data/build.ts`: 규칙 번들 `rules-<version>.json` + `manifest.json`(버전, 해시) 생성, `StaticRulesSource`에 manifest 확인·로컬 캐시 추가
4. [x] 화면: 목적 선택 → 입력 위저드("모름" 허용) → 결과 목록 → 상세(조건별 체크리스트, 근거 링크, 예상 한도·금리 범위)
   - [x] 입력 위저드 (2026-11-23): `src/screens/wizard/`. 목적 → 혼인·자녀 → 소득 → 순자산 → 이력 → 살 집/전세 집 → 결과. 답 모델 `answers.ts`(+`test/wizard.test.ts`), 결과는 `components/ResultCard.tsx`(테스트 화면과 공유)
   - [x] 결과 화면 (2026-11-23, D-21): 상품별 요약(도장) → 상세(맞지 않음 → 모름+"답하러 가기" → 충족 접힘), "결과 다시 보기", 금리 범위 설명, 지난 결혼 예정일 경고, 신청 기한 안내. 지역 모르면 예상 한도 없음(골든 P16·J12)
   - [ ] 청약저축(금리 우대)은 위저드에서 아직 묻지 않음
5. [x] 화면 용어 도움말 (D-16, 2026-11-23): `docs/GLOSSARY.md`를 빌드 때 `?raw`로 읽어 `src/glossary.ts`가 파싱. 질문·결과에 한 줄 안내 + "자세히"(`components/Help.tsx`). 화면에서 쓰는 용어 목록은 `TERM`, 빠진 용어·개발자 메모 노출은 `test/glossary.test.ts`가 잡음
6. [x] 순자산 계산 도우미 (D-18, 2026-11-24): 순자산 단계의 "모르겠으면 항목별로 계산하기" → 더하는 것 9개·빼는 것 3개 계산서 → "이 금액으로 넣기". 항목·안내는 `screens/wizard/assetItems.ts`(기준 `docs/sources/income-and-assets.md` 2절), 합산 `sumAssetItems`(+`test/assetItems.test.ts`). 하나라도 모름이면 합계 모름, 빚이 더 많으면 0. 엔진에는 합계만 넘김
7. [x] 입력값 기기 저장 (D-22, 2026-11-24): `src/platform/storage.ts`(웹 localStorage, 막히면 메모리), `screens/wizard/answersStore.ts`(버전 키, 값 검사 후 복원), 위저드 자동 저장·이어 하기·"입력 지우기". 테스트 `test/storage.test.ts`
8. [x] 가구원 수별 평균 주거면적 안내 (D-24, 2026-11-24): 면적 칸의 "다른 집은 보통 얼마나 넓게 살까요?" 표(1인 44.0㎡ ~ 5인 이상 87.1㎡). 출처는 국토부 2019년 주거실태조사를 주택산업연구원이 재분석한 값(`docs/sources/household-area.md`). 국토부 최신 가구원 수별 표를 찾으면 교체
9. [ ] 출시 전: 글꼴(Gowun Batang, IBM Plex Sans KR)을 Google Fonts 대신 자체 호스팅으로 바꿀지 검토(외부 요청 최소화)
10. [ ] Cloudflare Pages 배포(`*.pages.dev`), 면책 문구, 개인정보 처리방침, 분석(입력값 제외)

## 다음 세션 메모
- **다음 세션 시작점 (2026-11-24 마감):** v1 화면·코드 리뷰·면적 입력(평형 중심, D-25)·가구원 수별 면적 참고까지 완료(테스트 116개). 다음은 출시 준비(9~10번): 글꼴 자체 호스팅 검토 → 규칙 번들 빌드(`rules-data/build.ts`) → 배포 전 `/security-review` → Cloudflare Pages 배포. 사용자 대기: GitHub 레포 생성 후 push·CI 확인, REVIEW 2-10 콜센터 확인. 화면 작업 전 `frontend-design` 스킬, 디자인 토큰 D-20. 위저드 `/`, 개발용 `/#/dev`
- 사용자: GitHub 비공개 레포 생성 후 알려 주면 push·CI 첫 실행을 함께 확인
- 다음 출처 재검증 예정: 2027-02 (분기, D-17). 2027년도 순자산 기준은 통계청 발표 후 바뀜
- pnpm은 `corepack enable pnpm --install-directory "$APPDATA/npm"`로 설치함 (Program Files 쓰기 권한 없음). pnpm 12.21.0
- TypeScript는 6.0으로 고정 (typescript-eslint가 TS 7 미지원). Vite 8, Vitest 5, Tailwind 4, ESLint 10
- 골든 테스트 기본 프로필: 계약 체결(상태에는 영향 없음, D-15), 지방 케이스는 `regulated: false`, R 케이스는 `computeRate(...).baseRate`로 검증, J09는 합산 5,000을 3,000+2,000으로 나눔
- 엔진 린트 규칙: `packages/rules-engine/src`에서 `Date.now()`, 인자 없는 `new Date()`, `fetch`·`window`·`document`·`localStorage` 금지

## 사용자 TODO
- [ ] KIPRIS 상표 검색으로 "집각" 확인
- [ ] `jipgak.kr` 또는 `jipgak.com` 도메인 구매
- [ ] 골든 케이스: 원문 대조는 끝남. `docs/REVIEW.md` 3번의 남은 제품 판단 1건만 확인
- [ ] GitHub 원격 레포 생성 (비공개 권장) 후 push

## 확인 필요 (정책·규칙)

> 선택지와 우선순위까지 정리한 목록은 `docs/REVIEW.md`에 있습니다.

- 구입자금의 "만 30세 미만 단독세대주 제외"는 신혼·예비부부에게 해당하지 않는 것으로 보고 v1에서 생략
- 구입자금 DTI 60%는 부채 입력이 없어 v1에서 `manualChecks`로 처리
- "민법상 성년 세대주"는 소스에 나이 수치가 없어 조건 대신 `manualChecks`로 안내
- 다자녀 = 만 19세 미만 자녀 3인 이상(원문 FAQ 확인). 엔진은 나이를 따지지 않고 자녀 수로 판정
- 계약일을 모르면 현행 호당 한도, 수도권 외 규제지역 모르면 LTV 80% + 안내 (D-19)
