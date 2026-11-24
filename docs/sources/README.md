# 규칙 출처 (sources)

공고문·상품 안내 원문 전체 대신, 판정에 필요한 조건만 표로 요약해 두는 곳입니다. Claude는 원문 PDF나 웹페이지를 다시 읽지 말고 이 파일들을 기준으로 작업합니다.

| 파일 | 상품 | 단계 | 확인일 |
|---|---|---|---|
| [newlywed-purchase.md](newlywed-purchase.md) | 신혼부부전용 구입자금 | v1 | 2026-11-17 (2026-11-18 재검증) |
| [newlywed-jeonse.md](newlywed-jeonse.md) | 신혼부부전용 전세자금 | v1 | 2026-11-17 (2026-11-18 재검증) |
| [income-and-assets.md](income-and-assets.md) | 소득·순자산·자녀 산정 기준 (공통) | v1 | 2026-11-18 |
| [household-area.md](household-area.md) | 가구원 수별 평균 주거면적 (화면 참고용, 판정에 안 씀) | v1 | 2026-11-24 |

## 다음 후보 (v1.x ~ v2)

- 신생아 특례 디딤돌대출: https://nhuf.molit.go.kr/FP/FP05/FP0503/FP05030801.jsp
- 신생아 특례 버팀목대출: https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021401.jsp
- 내집마련 디딤돌대출(일반): https://nhuf.molit.go.kr/FP/FP05/FP0503/FP05030101.jsp
- 신혼부부 특별공급 자격 (청약홈): v2

## 갱신 규칙

1. 원문 값이 바뀌면 이 폴더의 요약 파일과 `packages/rules-data/products/*.json`을 **같은 커밋**에서 수정합니다.
2. 요약 파일의 확인일과 규칙 JSON의 `effectiveFrom`을 갱신합니다.
3. 영향받는 골든 케이스(`docs/golden-cases.md`)의 기대값을 다시 확인합니다.
