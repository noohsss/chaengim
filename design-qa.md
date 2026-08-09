# 정책 요약 카드 Design QA

## 비교 조건

- source visual truth: `/var/folders/pt/h_q0v83x2cjd8c141kvg06ym0000gn/T/codex-clipboard-69702fe1-4001-4ddf-ae73-8ac4c60f320a.png`
- implementation route: `http://127.0.0.1:3001/#policies`
- desktop screenshot: `docs/assets/qa/policy-card-1440.png` (실제 캡처 1425 × 891)
- mobile screenshot: `docs/assets/qa/policy-card-375.png` (실제 캡처 360 × 780)
- focused card screenshot: `docs/assets/qa/policy-card-focused-1440.png` (1104 × 235)
- side-by-side evidence: `docs/assets/qa/policy-card-comparison.jpg`
- state: 라이트 모드, 비인증, 정책 목록 기본 상태
- normalization: 기준 이미지는 전체 265 × 168을 2배 크기로 확대했고 구현 카드는 첫 카드 영역을 원본 비율로 축소해 한 비교 보드에 배치했다. 제품 콘텐츠 폭 차이는 유지하고 카드의 구조·위계·상태 표현을 비교했다.

## Findings

- 통과 — 사용자 요청 및 기준 이미지 대비 actionable P0/P1/P2 차이가 남아 있지 않다.
- Fonts and typography: 카테고리 캡션, 정책명, 마감 상태, 메타 라벨/값 순으로 기준 이미지의 위계를 유지했다. 긴 지원 내용은 한 줄 말줄임으로 카드 높이를 안정화했다.
- Spacing and layout rhythm: 데스크톱은 본문과 우측 액션 영역을 분리하고 하단 메타를 3열로 구성했다. 모바일은 액션을 한 행에 배치하고 메타를 세로로 전환해 수평 오버플로를 방지했다.
- Colors and visual tokens: 카테고리·북마크는 브랜드 블루, 임박 마감은 레드, D-day·D-N·상시 모집은 그린 의미 색을 사용했다. 지난 마감과 날짜 미확정 상태는 중립색으로 낮췄다.
- Icon and asset fidelity: 기준 이미지와 가장 가까운 Lucide의 Bookmark, BookmarkCheck, CalendarDays, Tag, CircleDollarSign 아이콘을 사용했다. CSS 도형이나 문자 기호는 사용하지 않았다.
- Copy and content: 상단의 날짜 중복을 없애고 `마감 N일 전`, `D-day`, `D-N`, `상시 모집` 상태를 표시한다. 정확한 마감일은 하단에만 남겼고 MVP 고정 정보인 `대상` 항목은 제거했다.
- Interaction and accessibility: 카드 제목과 액션은 실제 상세 페이지 링크이며 저장 상태에는 BookmarkCheck와 `챙기기 취소` 레이블을 사용한다. 브라우저 콘솔 warning/error는 데스크톱·모바일 모두 0건이었다.

## Focused Region Evidence

- 카드 상단: 카테고리, 정책명, 의미 색이 적용된 마감 상태가 좌측에 있고 북마크와 액션 버튼이 우측 독립 영역에 배치됐다.
- 카드 하단: `분야`, `지원 내용`, `마감일` 3개 항목만 유지했다.
- 내 챙김: 동일한 카드 컴포넌트를 사용하고 `관리 정보 수정`을 native `details`로 감싸 기본 접힘 상태와 펼침 상태를 제공한다.
- 인증이 필요한 `/my` 화면은 현재 비인증 브라우저 세션에서 리다이렉트되므로 펼침 상호작용의 브라우저 캡처는 남기지 못했다. 정적 타입 검사와 프로덕션 빌드로 렌더 경로를 검증했다.

## Comparison History

1. 초기 상태 — 목록과 내 챙김 카드가 기준 이미지와 다른 단순 텍스트 카드였고, 대상·정확한 마감일이 상단에 중복 노출됐다.
2. 1차 수정 — 공통 `PolicySummaryCard`를 만들고 우측 북마크 액션, 하단 메타 구획, 반응형 구조를 적용했다.
3. 사용자 피드백 반영 — `대상` 항목을 제거하고 상단을 빨간 임박 상태와 초록 D-day/D-N 상태로 변경했다. 내 챙김 관리 폼은 접기/펼치기로 전환했다.
4. 재검증 — 기준 이미지와 데스크톱 첫 카드를 `docs/assets/qa/policy-card-comparison.jpg`에서 함께 비교하고 375px 모바일 캡처에서 재배치를 확인했다. 추가 P0/P1/P2 없음.

## Implementation Checklist

- [x] 기준 이미지와 구현 카드를 한 비교 이미지에서 확인
- [x] 데스크톱과 모바일 viewport 확인
- [x] `대상` 제거 및 하단 3열 메타 확인
- [x] 마감 임박·D-day·D-N·상시·마감 상태 분기 확인
- [x] 북마크 아이콘과 상세 링크 확인
- [x] 브라우저 콘솔 warning/error 확인
- [x] lint, TypeScript, Webpack 프로덕션 빌드 통과

## Follow-up Polish

- P3: 실제 데이터에서 제목이 세 줄 이상인 극단적인 경우를 수집한 뒤 제목 줄 수 제한 여부를 결정한다.

final result: passed
