# 챙김 미니 브랜드 시스템 Design QA

**비교 조건**

- source visual truth path: `docs/assets/soft-horizon-reference.png`
- implementation route: `http://127.0.0.1:3000/design-system`
- implementation screenshot path: `docs/assets/qa/design-system-1440.png`, `docs/assets/qa/design-system-375.png`
- side-by-side evidence: `docs/assets/qa/design-system-reference-comparison.png`
- source pixels: 1487 × 1058 RGB
- desktop implementation: CSS viewport 1440 × 1024, device scale 1, stitched full page 1440 × 2978
- mobile implementation: CSS viewport 375 × 812, device scale 1, stitched full page 375 × 4619
- normalization: 비교 보드와 데스크톱 첫 화면을 각각 720px 폭 안에 비율 유지 축소해 1440 × 1024 한 장에 배치했다. 보드는 압축된 단일 보드이고 구현은 스크롤형 문서이므로 전체 높이는 일치 대상으로 삼지 않았다.
- state: 라이트 모드, 비인증, 정적 Server Component, 기본·compact·monochrome 로고와 정책 카드 기본 상태

**Findings**

- 통과 — actionable P0/P1/P2 차이가 남아 있지 않다.
- Fonts and typography: Pretendard Variable이 자체 번들로 로드되고 제목 22/28 Medium, 본문 16/24·14/20 Regular, 캡션 12/16이 보드의 위계와 일치한다. 375px에서도 제목과 본문이 잘리지 않는다.
- Spacing and layout rhythm: 데스크톱은 넓은 여백과 3열 로고, 5열 팔레트 구성을 유지하고 모바일은 1~2열로 순차 재배치된다. 375px에서 수평 오버플로는 없었다.
- Colors and visual tokens: 지정된 다섯 브랜드 색을 그대로 사용했다. 작은 본문과 버튼은 `#2563D8`, `#252A33`, `#5D6675` 등 AA 대비를 만족하는 의미 토큰으로 분리했다.
- Image quality and asset fidelity: ImageGen으로 정교화한 실제 PNG 로고를 사용했으며 CSS 도형이나 임시 아이콘으로 대체하지 않았다. 16·32·48·128px에서 체크·북마크·손 실루엣이 유지된다.
- Copy and content: 브랜드 성격, 로고 의미, 타입 예시와 정책 카드 문구가 한국어 제품 맥락에 맞고 프롬프트 문구가 UI에 노출되지 않는다.
- Interaction and accessibility: `챙기기` 버튼을 키보드로 활성화했고 `3px` 포커스 링과 `3px` 오프셋을 계산 스타일에서 확인했다. 브라우저 콘솔 error/warn은 0건이었다.

**Focused Region Evidence**

- 로고: `public/brand/brand-symbol-primary.png`, `public/brand/brand-symbol-monochrome.png`, `src/app/icon.png`를 투명도·여백·축소 크기별로 확인했다.
- 정책 카드: 데스크톱 4열 메타 정보가 모바일에서 1열로 바뀌고 버튼이 전체 폭으로 확장되는 상태를 확인했다.
- 별도 픽셀 단위 확대 비교는 필요하지 않았다. 기준 보드는 브랜드 방향 보드이며 실제 제품 화면의 1:1 복제물이 아니어서 색·타입·심볼·정보 위계를 집중 비교했다.

**Comparison History**

1. 초기 비교 — [P2] 데스크톱 `Minimum sizes` 예시가 3열 그리드의 첫 칸에만 놓여 시각적으로 고립됐다.
2. 수정 — 마지막 로고 샘플을 `grid-column: 1 / -1`로 확장해 최소 크기 스케일을 한 행 전체에서 읽게 했다.
3. 재검증 — `docs/assets/qa/design-system-reference-comparison.png`와 375px 전체 캡처에서 로고 샘플의 균형, 모바일 재배치, 가로 오버플로 부재를 확인했다. 추가 P0/P1/P2 없음.

**Implementation Checklist**

- [x] 기준 보드와 브라우저 렌더링을 한 비교 이미지에서 확인
- [x] 1440px 데스크톱과 375px 모바일 확인
- [x] 로고 16·32·48·128px, 브랜드·단색 자산 확인
- [x] 키보드 포커스와 버튼 상태 확인
- [x] 브라우저 콘솔 error/warn 확인
- [x] lint, TypeScript, Webpack 프로덕션 빌드 통과

**Follow-up Polish**

- P3: 실제 정책 데이터와 연결할 때 카드의 긴 제목·긴 분야명에 대한 두 줄 말줄임 규칙을 제품 UI 단계에서 추가한다.

final result: passed
