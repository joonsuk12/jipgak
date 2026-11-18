# 집각 (jipgak)

신혼·예비부부용 정책 대출(이후 청약 특별공급) 자격 판정 서비스입니다. 판정은 기기 안의 TS 엔진이 하고, 정책 조건은 JSON 규칙 데이터로 관리합니다. 배포는 정적 호스팅이 기본이며, 기능별 토글로 온라인 서버 모드로 전환할 수 있습니다.

## 세션 시작 시 읽을 순서

1. `docs/STATUS.md`: 현재 단계와 다음 할 일. **항상 먼저 읽기**
2. 작업에 필요한 문서만 골라 읽기
   - 구조나 인터페이스를 다룰 때: `docs/ARCHITECTURE.md`
   - 왜 이렇게 정했는지 궁금할 때: `docs/DECISIONS.md` (여기 있는 결정은 다시 논의하지 않음)
   - 규칙값이 필요할 때: `docs/sources/*.md` (원문 웹페이지·PDF를 다시 읽지 않음)
   - 테스트 기대값: `docs/golden-cases.md`
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

CI(`.github/workflows/ci.yml`)는 스키마 검사 → lint → typecheck → test → build 순서로 돌립니다.


## 규칙

- **TypeScript strict.** 식별자·파일명은 영어, 화면 문구와 규칙 `label`은 한국어로 씁니다.
- **`packages/rules-engine`은 순수 함수만 둡니다.** 네트워크, DOM, 플랫폼 API, `Date.now()` 직접 호출 금지. 기준일은 `asOf` 인자로 받습니다.
- **정책 수치는 `docs/sources/`에 있는 값만 씁니다.** 없는 값을 추측하거나 만들어 내지 않습니다. 필요하면 STATUS에 "확인 필요"로 남깁니다.
- 규칙 JSON을 수정하면 해당 `docs/sources/*.md`와 골든 케이스도 같은 커밋에서 맞춥니다.
- 화면 코드는 `src/data/sources.ts` 인터페이스만 의존합니다. `fetch`를 화면에서 직접 호출하지 않습니다.
- 사용자 입력값(소득, 자산 등)은 서버 전송, 로그, 분석 이벤트에 절대 포함하지 않습니다.
- 서버 모드(`api`) 구현은 해당 단계 전까지 만들지 않습니다. 인터페이스만 둡니다.

## 토큰 절약 수칙

- `node_modules/`, `dist/`, `android/`, `ios/`, `*.lock`은 읽거나 검색하지 않습니다.
- 맞는지 추론하기보다 테스트를 실행해서 확인합니다. 출력이 길면 실패한 부분만 봅니다.
- 한 세션에 작업 하나만 합니다. 끝나면 `docs/STATUS.md`의 "완료"와 "다음 할 일"을 갱신하고 커밋합니다.
- 새 결정을 내리면 `docs/DECISIONS.md`에 한 항목으로 추가합니다.

## 커밋

- 작은 단위로 커밋하고, 메시지는 한국어 한 줄 요약으로 씁니다. 예: `rules-engine: 소득 조건 평가 추가`
- 회사 코드나 내부 정보는 레포에 넣지 않습니다.
