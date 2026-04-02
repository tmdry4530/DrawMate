# DrawMate

작가(일러스트레이터/디자이너)와 어시스턴트(의뢰인/리크루터)를 연결하는 포트폴리오 플랫폼.
포트폴리오 탐색, 북마크, 1:1 메시징, 협업 문의 기능을 제공한다.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack dev)
- **Language**: TypeScript (strict mode)
- **React**: 19
- **Styling**: Tailwind CSS v4 + CSS variables (shadcn/ui new-york style)
- **UI Components**: shadcn/ui (Radix UI), Lucide icons
- **Animation**: Framer Motion, GSAP, Lenis (smooth scroll)
- **3D**: Three.js + React Three Fiber/Drei (landing page turntable)
- **State**: Zustand (client), TanStack React Query (server state)
- **Backend**: Supabase (Auth, Postgres, Storage, RLS)
- **Validation**: Zod
- **Node**: 22 (.nvmrc)

## Project Structure

```
src/
  app/
    (app)/          # 인증된 사용자 영역 (studio, messages, bookmarks, notifications, settings)
    (auth)/         # 인증 관련 (sign-in, sign-up, onboarding, reset-password)
    (marketing)/    # 공개 영역 (landing, explore, portfolio detail, user profile, privacy, terms, contact)
    api/v1/         # REST API routes
    auth/callback/  # Supabase OAuth callback
  components/
    ui/             # shadcn/ui primitives (수정 금지 - shadcn CLI로 관리)
    layout/         # Header, Footer, MobileNav, MarketingShell
    landing/        # 랜딩 페이지 (LandingClient, TurntableStage, CoverFlowCarousel)
    portfolio/      # 포트폴리오 카드, 갤러리, 북마크 버튼
    portfolio-editor/ # 에디터 위저드 (이미지 업로더, 태그 셀렉터, 템플릿)
    search/         # 검색바, 필터 패널, 그리드, 정렬
    messaging/      # 대화 목록, 메시지 버블
    notifications/  # 알림 아이템
    auth/           # 소셜 로그인 버튼
  lib/
    supabase/       # browser-client, server-client, admin-client, middleware
    utils/          # cn(), api-response helpers, client-api, request-id
    providers.tsx   # QueryClientProvider wrapper
  server/
    mappers/        # snake_case <-> camelCase 변환
  types/            # database.ts (enum types), api.ts (ApiSuccess, ApiError, CursorPage)
  validators/       # Zod schemas (auth, common, messaging, portfolio, profile)
supabase/
  migrations/       # SQL 마이그레이션 (extensions, enums, profiles, storage, portfolios, messaging, notifications)
  config.toml
  seed.sql
Wireframe/          # JSON 와이어프레임 (디자인 시스템, 각 페이지별)
```

## Commands

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run dev:webpack  # 개발 서버 (Webpack fallback)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
```

## Code Conventions

### General
- 한국어 사용자를 위한 프로젝트이므로 UI 텍스트와 에러 메시지는 한국어로 작성
- API 응답은 `src/lib/utils/api-response.ts`의 `success()`, `error()` 헬퍼로 통일
- DB 컬럼은 snake_case, API 응답/프론트엔드는 camelCase (`toCamelCaseKeys` 사용)
- 커서 기반 페이지네이션 (base64 encoded cursor)
- Zod schema로 입력값 검증 (`src/validators/`)

### Supabase
- 브라우저: `src/lib/supabase/browser-client.ts`의 `createClient()`
- 서버(RSC/Route Handler): `src/lib/supabase/server-client.ts`의 `createClient()`
- 관리자(service role): `src/lib/supabase/admin-client.ts`의 `createAdminClient()`
- RLS가 활성화되어 있으므로 서버에서도 반드시 적절한 클라이언트 사용
- 스토리지 버킷: `portfolio-public`, `profile-avatars`, `chat-attachments`

### Styling
- Tailwind CSS v4 (globals.css에서 `@import "tailwindcss"` 사용)
- CSS 변수 기반 테마 (primary color: purple 258)
- `cn()` 유틸로 조건부 클래스 병합 (clsx + tailwind-merge)
- shadcn/ui 컴포넌트 수정 시 `components/ui/` 파일 직접 수정하지 말 것
- 커스텀 애니메이션 클래스는 globals.css에 정의됨 (animate-fade-up, glass, glow 등)

### Route Groups
- `(app)` - 인증 필요, Header/Footer/MobileNav 포함
- `(auth)` - 인증 페이지 전용 레이아웃
- `(marketing)` - 공개 페이지, MarketingShell 레이아웃

### API
- 모든 API는 `/api/v1/` prefix
- 인증이 필요한 API는 `supabase.auth.getUser()`로 직접 확인
- 에러 응답 형식: `{ error: { code, message, details?, fieldErrors? }, requestId }`
- 성공 응답 형식: `{ data, meta?, requestId }`

## Data Model (Key Entities)

- **profiles** - 사용자 프로필 (role: assistant/recruiter, availability_status)
- **portfolios** - 포트폴리오 (status: draft/published/archived, visibility: public/unlisted)
- **portfolio_images** - 포트폴리오 이미지 (sort_order, is_cover)
- **tags** / **portfolio_tags** - 태그 (category: field/skill/tool/style)
- **conversations** / **conversation_participants** / **messages** - 1:1 메시징
- **bookmarks** - 포트폴리오 북마크
- **notifications** - 알림
- **portfolio_templates** - 포트폴리오 템플릿

## Rules

- `.env.local`에 Supabase URL, anon key, service role key가 설정되어야 함
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 말 것
- 새 마이그레이션 추가 시 `supabase/migrations/` 디렉토리에 타임스탬프 순서로 생성
- `src/components/ui/` 파일은 shadcn CLI가 관리하므로 직접 수정하지 말 것 - 커스텀이 필요하면 래퍼 컴포넌트를 만들 것
- Three.js/R3F 코드는 반드시 `"use client"` + dynamic import로 SSR 회피
- 이미지 최적화: next/image + Supabase Storage public URL (remotePatterns 설정 확인)
