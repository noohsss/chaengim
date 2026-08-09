# 챙김

청년 정책을 찾고, 필요한 정책을 챙겨 신청 과정과 다음 행동을 관리하는 웹 서비스입니다.

## 주요 기능

- 온통청년 정책 검색·필터·상세 조회
- 정책 챙기기와 신청 상태·우선순위·메모·결과 관리
- 저장한 정책의 AI 분석과 2~3개 정책 비교
- 마감 임박·정책 변경 웹 알림
- Google OAuth 로그인과 사용자 데이터 관리

AI 결과는 정책 자격이나 수급 가능성을 확정하지 않으며, 최종 신청 조건은 공식 기관에서 확인해야 합니다.

## 기술 스택

- Next.js App Router, React, TypeScript
- Tailwind CSS, Lucide, Pretendard
- Supabase Auth·PostgreSQL·RLS
- 온통청년 API, Google Gemini API
- Vercel Cron

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 Supabase, 온통청년 API, Gemini, Cron 관련 환경변수를 설정해야 합니다. Google OAuth의 콜백 URL은 다음 경로를 사용합니다.

```text
http://localhost:3000/auth/callback
```

Supabase 데이터베이스는 `supabase/migrations`의 마이그레이션을 적용한 뒤 사용합니다.

## 주요 명령어

```bash
npm run dev          # 개발 서버
npm run typecheck    # TypeScript 검사
npm run lint         # ESLint 검사
npm test             # 테스트
npm run build        # 프로덕션 빌드
```

## 주요 경로

- `/`: 서비스 소개와 정책 탐색
- `/policies/[id]`: 정책 상세와 챙기기
- `/my`: 내 챙김 관리
- `/my/analysis`: AI 분석
- `/my/compare`: 정책 비교
- `/notifications`: 웹 알림함
- `/settings`: 프로필과 회원 탈퇴

정책 동기화와 알림 생성은 `CRON_SECRET`으로 보호된 Vercel Cron Route Handler에서 실행합니다.
