# DrawMate 프로젝트 현황 보고서

> 최종 업데이트: 2026-04-03
> 브랜치: main

---

## 1. 프로젝트 개요

DrawMate는 **작가(일러스트레이터/디자이너)와 의뢰인(리크루터)을 연결하는 포트폴리오 플랫폼**이다.
포트폴리오 탐색, 북마크, 1:1 메시징, 협업 문의 기능을 제공하며, 한국어 사용자를 주요 대상으로 한다.

---

## 2. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router, Turbopack) | 16.2.1 |
| Language | TypeScript (strict mode) | 5.x |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS v4 + CSS Variables | 4.x |
| UI Components | shadcn/ui (Radix UI), Lucide Icons | - |
| Animation | Framer Motion, GSAP, Lenis | - |
| State (Client) | Zustand | 5.0.12 |
| State (Server) | TanStack React Query | 5.91.3 |
| Backend/DB | Supabase (Auth, Postgres, Storage, RLS) | 2.99.3 |
| Validation | Zod | 4.3.6 |
| Toast | Sonner | 2.0.7 |
| Node | 22 (.nvmrc) | - |

---

## 3. 프로젝트 규모

| 항목 | 수량 |
|------|------|
| 페이지 라우트 | 34개 |
| API 엔드포인트 | 17개 |
| UI 컴포넌트 | 40개 |
| DB 마이그레이션 | 18개 |
| Zod 스키마 | 5개 |
| Zustand 스토어 | 2개 (explore, editor) |

---

## 4. 프로젝트 구조

### 4.1 라우트 그룹

| 그룹 | 용도 | 레이아웃 |
|------|------|----------|
| `(app)` | 인증 사용자 영역 | Header + Footer + MobileNav |
| `(auth)` | 인증 페이지 | 인증 전용 레이아웃 |
| `(marketing)` | 공개 페이지 | MarketingShell 레이아웃 |

### 4.2 페이지 라우트

**인증 `(auth)`**
| 경로 | 기능 |
|------|------|
| `/sign-in` | 이메일/소셜 로그인 |
| `/sign-up` | 회원가입 |
| `/onboarding` | 역할 선택 (assistant/recruiter) |
| `/reset-password` | 비밀번호 재설정 |

**앱 `(app)` — 인증 필요**
| 경로 | 기능 |
|------|------|
| `/studio` | 대시보드 (통계, 최근 활동, 퀵 액션) |
| `/studio/portfolios` | 내 포트폴리오 목록 |
| `/studio/portfolios/new` | 포트폴리오 생성 (4단계 위저드) |
| `/studio/portfolios/[id]/edit` | 포트폴리오 수정 |
| `/messages` | 대화 목록 |
| `/messages/[id]` | 대화 상세 |
| `/bookmarks` | 북마크 목록 |
| `/notifications` | 알림 |
| `/settings` | 설정 허브 |
| `/settings/account` | 계정 설정 |
| `/settings/profile` | 프로필 편집 |
| `/settings/notifications` | 알림 설정 |

**마케팅 `(marketing)` — 공개**
| 경로 | 기능 |
|------|------|
| `/` | 랜딩 페이지 (히어로, 벤토 그리드, 마키, CTA) |
| `/explore` | 포트폴리오 탐색 (검색, 필터, 정렬) |
| `/portfolio/[slug]` | 포트폴리오 상세 |
| `/users/[id]` | 사용자 프로필 |
| `/contact` | 문의 |
| `/privacy` | 개인정보처리방침 |
| `/terms` | 이용약관 |

### 4.3 API 엔드포인트 (`/api/v1/`)

| 메서드 | 엔드포인트 | 기능 |
|--------|-----------|------|
| POST | `/auth/sign-in` | 로그인 |
| POST | `/auth/sign-up` | 회원가입 |
| GET | `/me` | 내 정보 조회 |
| PATCH | `/me/profile` | 프로필 수정 |
| POST | `/me/avatar` | 아바타 업로드 |
| GET | `/portfolios` | 포트폴리오 목록 (검색/필터/정렬/페이지네이션) |
| POST | `/portfolios` | 포트폴리오 생성 |
| GET | `/portfolios/mine` | 내 포트폴리오 목록 |
| GET/PATCH/DELETE | `/portfolios/[id]` | 포트폴리오 상세/수정/삭제 |
| POST | `/portfolios/[id]/publish` | 포트폴리오 발행 |
| POST | `/portfolios/[id]/bookmark` | 북마크 토글 |
| GET/POST | `/portfolios/[id]/images` | 이미지 목록/업로드 |
| POST | `/portfolios/[id]/images/reorder` | 이미지 정렬 |
| DELETE | `/portfolios/[id]/images/[imgId]` | 이미지 삭제 |
| GET/POST | `/conversations` | 대화 목록/생성 |
| GET/POST | `/conversations/direct` | 다이렉트 대화 조회/생성 |
| GET/POST | `/conversations/[id]/messages` | 메시지 목록/전송 |
| POST | `/messages/attachments` | 첨부파일 업로드 |
| GET | `/notifications` | 알림 목록 |
| POST | `/notifications/[id]/read` | 알림 읽음 처리 |
| POST | `/notifications/read-all` | 알림 전체 읽음 |
| GET | `/tags` | 태그 목록 |
| GET | `/templates` | 포트폴리오 템플릿 |
| GET | `/users/[id]` | 사용자 프로필 조회 |

### 4.4 컴포넌트 (40개)

| 디렉토리 | 역할 |
|----------|------|
| `ui/` | shadcn/ui 기본 컴포넌트 (CLI 관리, 직접 수정 금지) |
| `layout/` | Header, Footer, MobileNav, MarketingShell |
| `landing/` | LandingClient, TurntableStage, CoverFlowCarousel |
| `portfolio/` | 포트폴리오 카드, 갤러리, 북마크 버튼, 작가 카드, 연락 CTA, 태그 |
| `portfolio-editor/` | 에디터 위저드, 이미지 업로더, 태그 셀렉터, 템플릿, 정보 폼 |
| `search/` | 검색바, 필터 패널, 포트폴리오 그리드, 정렬 드롭다운 |
| `messaging/` | 대화 목록, 메시지 버블, 메시지 입력 |
| `notifications/` | 알림 아이템 |
| `auth/` | 소셜 로그인 버튼 |

### 4.5 상태 관리

| 스토어 | 용도 | 주요 상태 |
|--------|------|-----------|
| `explore-store` | 검색/필터 | q, sort, filters (field/skill/tool/style), URL 동기화 |
| `editor-store` | 포트폴리오 에디터 | currentStep, images, tags, formData, isDirty, 자동저장 |

### 4.6 데이터베이스

**마이그레이션 (18개)**
```
01 extensions           DB 확장 기능 (pgcrypto, uuid-ossp)
02 enum_types           열거형 타입 (portfolio_status, visibility, roles)
03 profiles             사용자 프로필 테이블
04 storage_buckets      스토리지 버킷 정책
05 portfolio_tables     포트폴리오, 이미지, 태그, 북마크 테이블
06 portfolio_rpc        포트폴리오 RPC 함수
07 tag_seeds            태그 시드 데이터
08 portfolio_templates  포트폴리오 템플릿 시드
09 storage_portfolio    포트폴리오 이미지 스토리지
10 messaging_tables     대화, 메시지, 첨부파일 테이블
11 notifications        알림, 푸시 구독 테이블
12 messaging_rpc        메시징 RPC 함수
13 messaging_triggers   last_message_at 자동 갱신 트리거
14 chat_storage         채팅 첨부파일 스토리지 버킷
15 hotfixes             버그 수정
16 verification_phase2  검증 2단계 수정
17 fix_notify_trigger   알림 트리거 수정
18 fix_cp_rls           대화 참여자 RLS 수정
```

**주요 테이블**
| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (role: assistant/recruiter, availability_status) |
| `portfolios` | 포트폴리오 (status: draft/published/archived, visibility: public/unlisted) |
| `portfolio_images` | 포트폴리오 이미지 (sort_order, is_cover) |
| `tags` / `portfolio_tags` | 태그 (category: field/skill/tool/style) |
| `conversations` / `conversation_participants` / `messages` | 1:1 메시징 |
| `bookmarks` | 포트폴리오 북마크 |
| `notifications` | 알림 (type: message_received/bookmark_added) |
| `portfolio_templates` | 포트폴리오 템플릿 (layout_schema JSON) |
| `push_subscriptions` | 푸시 알림 구독 (미연동) |

**스토리지 버킷**
| 버킷 | 접근 | 용도 |
|------|------|------|
| `portfolio-public` | public | 포트폴리오 이미지 (original/display/thumb) |
| `profile-avatars` | public | 프로필 아바타 |
| `chat-attachments` | auth | 메시지 첨부파일 |

---

## 5. 기능 구현 현황

### 5.1 완료 (16개)

| 기능 | 설명 |
|------|------|
| **이메일/소셜 인증** | Supabase Auth, Google/GitHub OAuth |
| **온보딩** | 가입 후 역할 선택 (작가/의뢰인) |
| **비밀번호 재설정** | 이메일 기반 복구 |
| **프로필 관리** | 디스플레이 네임, 바이오, 헤드라인, SNS 링크, 아바타 업로드 |
| **공개 프로필** | `/users/[id]` 페이지, 포트폴리오 쇼케이스 |
| **포트폴리오 CRUD** | 생성(4단계 위저드)/수정/삭제(소프트)/발행 |
| **포트폴리오 템플릿** | 5개 이상 시드 템플릿 |
| **이미지 관리** | 드래그앤드롭 업로드, 리오더, 커버 선택, 3사이즈 저장 |
| **태그 시스템** | field/skill/tool/style 4카테고리, 최대 23개 |
| **에디터 자동저장** | 3초 디바운스, isDirty 추적 |
| **검색 & 탐색** | 전문 검색(GIN), 태그 필터, 정렬(최신/인기/가격), URL 동기화 |
| **북마크** | 토글 방식, DB 카운트 추적, 북마크 목록 페이지 |
| **1:1 메시징** | 실시간(Supabase Realtime + 폴링), 낙관적 UI, 한국어 IME, 파일 첨부 |
| **알림** | 읽음/안읽음, 개별/일괄 읽음 처리, 드롭다운 UI |
| **다크모드** | CSS 변수 기반 테마 전환 |
| **반응형 디자인** | 모바일 퍼스트, md/lg 브레이크포인트 |

### 5.2 부분 구현 (3개)

| 기능 | 현황 | 상세 |
|------|------|------|
| **스튜디오 대시보드** | ⚠️ | 조회수/북마크/메시지 통계가 목업 데이터. 실제 조회수 추적 미구현 |
| **계정 설정** | ⚠️ | 이메일/비밀번호 변경 UI가 disabled 상태. API 미구현 |
| **푸시 알림** | ⚠️ | `push_subscriptions` DB 스키마만 존재. 브라우저 연동 없음 |

### 5.3 미구현

| 기능 | 설명 |
|------|------|
| 고급 검색 필터 | 가격 범위, 날짜 범위, 가용 상태 필터 |
| 결제 연동 | `starting_price_krw` 필드만 저장, 체크아웃 없음 |
| 사용자 차단/신고 | 모더레이션 기능 없음 |
| 메시지 검색 | 대화 내용 기반 검색 불가 |
| 포트폴리오 버전 관리 | 단일 버전만 지원 |
| 이메일 템플릿 | Supabase 기본 템플릿 사용 |

---

## 6. 아키텍처

### 6.1 데이터 흐름

```
Client (React 19)
  → Zustand (클라이언트 상태)
  → TanStack Query (서버 상태 캐싱)
  → Next.js API Routes (/api/v1/*)
  → Supabase Auth + RLS
  → PostgreSQL + Storage
```

### 6.2 보안

- Supabase RLS(Row Level Security) 전체 테이블 적용
- 서버: `server-client` (RSC/Route Handler), `admin-client` (서비스 역할)
- `SUPABASE_SERVICE_ROLE_KEY` 서버 전용, 클라이언트 노출 금지
- Zod 스키마로 모든 API 입력값 검증
- 인증이 필요한 API는 `supabase.auth.getUser()`로 직접 확인

### 6.3 컨벤션

- DB 컬럼 `snake_case` → API/프론트엔드 `camelCase` (`toCamelCaseKeys` 자동 변환)
- 커서 기반 페이지네이션 (base64 인코딩)
- 통일된 API 응답 형식 (`success()` / `error()` 헬퍼)
- Three.js/R3F 코드는 `"use client"` + dynamic import로 SSR 회피

---

## 7. 코드 품질

### 7.1 구현된 품질 요소

- TypeScript strict mode 100%
- 통일된 API 응답/에러 형식
- RLS 정책으로 데이터 접근 제어
- 로딩 상태 (스피너, 스켈레톤, disabled 버튼)
- 접근성 기본 (ARIA 라벨, 시맨틱 HTML, 키보드 네비게이션)

### 7.2 미비한 품질 요소

| 항목 | 상태 |
|------|------|
| 자동화 테스트 (Jest/Vitest/Cypress) | ❌ 없음 |
| 에러 추적 (Sentry 등) | ❌ 없음 |
| 사용자 분석 (GA/Mixpanel) | ❌ 없음 |
| CI/CD 파이프라인 | ❌ 없음 |
| 번들 분석 (Lighthouse) | ❌ 없음 |
| API Rate Limiting | ❌ 없음 |
| 업타임 모니터링 | ❌ 없음 |

---

## 8. 개발 타임라인

| 단계 | 시기 | 내용 |
|------|------|------|
| Phase 1 — 초기 구축 | 2026-03-22 | 프로젝트 초기화, DB 스키마, 인증, 포트폴리오 CRUD, 메시징, 알림 |
| Phase 2 — QA 안정화 | 2026-03-23 | P0/P1/P2 이슈 수정, 메시지 500 에러, 인증 회귀 버그, 대화 API 안정화 |
| Phase 3 — UI/UX 고도화 | 2026-03-24 | UI 리디자인, 실시간 메시지 동기화, Optimistic UI, 한국어 IME, 알림 드롭다운 |
| Phase 4 — 마무리 | 2026-03-25 | 이미지 표시 개선, 스튜디오 프로필, 아바타 업로드 |
| Phase 5 — Stitch 디자인 | 2026-04 | Stitch 디자인 시스템 적용, UI 개선, 포트폴리오 중복 방지, 메시지 동기화 |

---

## 9. 향후 고려사항

- **테스트 프레임워크 도입**: 단위 테스트(Vitest) + E2E 테스트(Playwright) 구성
- **CI/CD 파이프라인**: GitHub Actions 기반 자동 빌드/배포
- **에러 트래킹**: Sentry 연동으로 프로덕션 에러 모니터링
- **성능 최적화**: Lighthouse 점검, 번들 사이즈 분석, 이미지 lazy loading
- **접근성 점검**: 스크린리더, 키보드 내비게이션 심층 테스트
- **국제화(i18n)**: 현재 한국어 하드코딩 → 다국어 지원 시 라이브러리 도입
- **사용자 분석**: GA 또는 Mixpanel 연동
- **계정 설정 완성**: 이메일/비밀번호 변경 API 구현
- **푸시 알림 연동**: 브라우저 Push API + Service Worker
- **스튜디오 실데이터**: 실제 조회수 추적 및 통계 대시보드 연결
