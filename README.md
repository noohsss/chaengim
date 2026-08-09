# 챙김

> 청년 정책을 찾고, 챙기고, 신청 과정과 다음 행동을 관리하는 서비스

[서비스 URL](https://chaengim-aia-gent3.vercel.app) | [GitHub](https://github.com/noohsss/chaengim) | [Demo](https://chaengim-aia-gent3.vercel.app)

![챙김 서비스 미리보기](./public/og.png)

## 1. 프로젝트 소개

청년 정책 정보는 여러 기관과 사이트에 흩어져 있고, 정책마다 신청 조건과 기간이 다릅니다. 챙김은 정책을 발견한 순간부터 신청 결과를 기록하는 과정까지 한곳에서 이어서 관리할 수 있도록 만든 반응형 웹 서비스입니다.

- 개발 배경: 청년 정책을 찾은 뒤에도 신청 기간과 다음 행동을 놓치기 쉬운 문제에서 출발했습니다.
- 해결하려는 문제: 흩어진 정책 정보를 검색하고, 개인별로 챙긴 정책의 진행 상황을 지속적으로 관리합니다.
- 주요 사용자: 정부·지자체 청년 정책을 탐색하고 신청하려는 청년
- 제공하는 가치: 정책 탐색, 신청 과정 관리, AI 기반 다음 행동 정리를 하나의 흐름으로 제공합니다.

AI 결과는 자격이나 수급 가능성을 확정하지 않습니다. 최종 신청 조건과 결과는 반드시 공식 기관에서 확인해야 합니다.

## 2. 주요 기능

### 정책 탐색과 상세 조회

온통청년 정책을 키워드·카테고리·지역으로 검색하고, 지원 내용·신청 조건·기간·공식 신청 링크를 확인할 수 있습니다. 비회원도 정책을 먼저 탐색할 수 있습니다.

### 내 챙김 관리

관심 정책을 저장하고 신청 상태, 우선순위, 메모, 신청 결과를 관리합니다. 저장한 정책은 마감일이 빠른 순서로 확인할 수 있습니다.

### AI 분석과 정책 비교

챙긴 정책을 바탕으로 오늘 확인할 순서, 다음 행동, 확인이 필요한 조건을 정리합니다. 2~3개 정책을 선택해 지원 내용·조건·기간·신청 방법을 비교할 수도 있습니다.

### 웹 알림

마감 7일 전·1일 전 알림과 정책 주요 변경 알림을 제공하며, 알림함에서 개별 또는 전체 읽음 처리를 지원합니다.

## 3. 사용자 흐름

```text
정책 탐색
  → 정책 상세·조건 확인
  → Google 로그인
  → 정책 챙기기
  → 상태·우선순위·메모 관리
  → AI 분석 또는 2~3개 정책 비교
  → 공식 신청처 이동
  → 신청 결과 기록 및 알림 확인
```

## 4. 기술 스택

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Lucide React
- Pretendard Variable

### Backend / Database

- Next.js Server Components, Server Actions, Route Handlers
- Supabase Auth
- PostgreSQL
- Supabase Row Level Security

### AI

- Google Gemini API
- `@google/genai`
- Zod 기반 구조화 출력 검증

### External API

- 온통청년 정책 API

### Infrastructure

- Vercel
- Vercel Cron

## 5. 시스템 구조

```text
User Browser
     │
     ▼
Next.js / Vercel
     ├─ Supabase
     │   ├─ Auth
     │   └─ PostgreSQL + RLS
     │
     ├─ 온통청년 정책 API
     │
     └─ Google Gemini API
```

브라우저는 외부 API와 Gemini를 직접 호출하지 않습니다. 정책 동기화, 사용자 데이터 접근, AI 요청은 서버에서 처리하며 외부 키와 Supabase service role 키도 서버 전용으로 유지합니다.

## 6. 주요 기술적 고민

### 외부 API 데이터 통합

문제:

온통청년 API의 원본 필드와 서비스 화면에서 필요한 데이터 구조가 다르고, 동기화할 때 같은 외부 정책이 중복 저장될 수 있습니다.

해결:

정책 제목, 지원 내용, 조건, 기간, 지역, 신청 링크를 포함하는 내부 공통 모델을 정의하고, API Adapter에서 정규화합니다. 출처별 외부 ID를 `source_refs`에 저장하고 이를 기준으로 upsert합니다.

결과:

화면과 도메인 로직이 외부 API 형식에 직접 의존하지 않으며, 정책 변경 감지와 중복 방지를 일관되게 처리할 수 있습니다.

### AI 분석 구조

문제:

AI가 정책 원문에 없는 자격을 단정하거나, 잘못된 정책을 근거로 설명할 위험이 있습니다.

선택:

AI 요청은 서버에서만 수행하고, 정책 원문과 사용자 프로필·챙김 데이터를 제한된 입력으로 전달합니다. Gemini의 구조화 출력을 Zod로 검증한 뒤 정책 ID가 실제 챙긴 정책인지 다시 확인해 저장합니다.

이유:

AI 설명은 보조 정보로 유지하면서 정책 사실과 분리하고, 잘못된 응답·알 수 없는 정책 참조·과도한 요청을 저장하거나 노출하지 않기 위해서입니다. 동일 입력 결과는 재사용하고 사용자별 요청 횟수도 제한합니다.

### 사용자 지역과 정책 지역 판정

문제:

프로필 지역과 정책 대상 지역이 다르면 사용자가 신청 가능 여부를 오해할 수 있습니다.

해결:

전국 정책(`00`) 또는 사용자 지역을 포함하는 정책은 통과시키고, 그 외 정책은 서버에서 지역 불일치 목록으로 계산해 AI 분석 화면에 공식 안내 재확인 코멘트를 표시합니다.

### 인증 후 원래 화면 복귀

문제:

비로그인 사용자가 정책을 챙긴 뒤 로그인하면 원래 보던 정책으로 돌아가지 못할 수 있습니다.

해결:

내부 경로만 허용하는 `next` 검증과 OAuth 콜백용 단기 쿠키를 사용하고, 요청 origin을 기준으로 로컬·Production 콜백 주소를 구성합니다.

## 7. 프로젝트 구조

```text
src/
├── app/         # App Router 페이지, 레이아웃, Server Actions, Route Handlers
├── components/  # 재사용 UI 컴포넌트
├── features/    # 프로필·챙김·AI 도메인의 스키마와 옵션
├── lib/         # 인증, 환경변수, Supabase 클라이언트와 공통 기반 코드
└── server/      # 정책·챙김·AI·알림의 서버 도메인 로직

supabase/
└── migrations/  # PostgreSQL 스키마, 제약, RLS 마이그레이션

public/
└── brand/       # 브랜드 심볼과 정적 이미지
```

## 8. 실행 방법

### 사전 요구사항

- Node.js 20.9 이상
- Supabase 프로젝트
- Google OAuth 설정
- 온통청년 API 키
- Google Gemini API 키

### 로컬 실행

```bash
npm install
cp .env.example .env.local
```

`.env.local`에 Supabase, 온통청년 API, Gemini, Cron 관련 환경변수를 설정하고 Supabase 마이그레이션을 적용합니다.

```bash
npm run dev
```

로컬 OAuth 콜백 주소:

```text
http://localhost:3000/auth/callback
```

### 검증 명령

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 9. 향후 개선 사항

- 알림 생성기와 오류 경로의 계약 테스트 확대
- 정책 검색 FTS·trigram 실제 성능 점검 및 최적화
- Production Vercel·Supabase 로그와 모니터링 강화
- 정책 데이터 품질 및 외부 ID 중복 검증 자동화
- 이메일 알림과 브라우저 푸시 검토
- 추가 공공 정책 데이터 소스 연동
