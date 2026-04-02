# DrawMate 프로젝트 현황 보고서

> 작성일: 2026-04-02
> 버전: 0.1.0
> 브랜치: main (총 커밋 46개)

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
| State (Client) | Zustand | 5.0.12 |
| State (Server) | TanStack React Query | 5.91.3 |
| Backend/DB | Supabase (Auth, Postgres, Storage, RLS) | 2.99.3 |
| Validation | Zod | 4.3.6 |
| Toast | Sonner | 2.0.7 |
| Node | 22 (.nvmrc) | - |

---

## 3. 프로젝트 구조

### 3.1 라우트 그룹

| 그룹 | 용도 | 주요 페이지 |
|------|------|-------------|
| `(app)` | 인증 사용자 영역 | studio, messages, bookmarks, notifications, settings |
| `(auth)` | 인증 페이지 | sign-in, sign-up, onboarding, reset-password |
| `(marketing)` | 공개 페이지 | 랜딩, explore, portfolio 상세, user 프로필, privacy, terms, contact |

### 3.2 컴포넌트 (40개 TSX 파일)

| 디렉토리 | 역할 |
|----------|------|
| `ui/` | shadcn/ui 기본 컴포넌트 (CLI 관리, 직접 수정 금지) |
| `layout/` | Header, Footer, MobileNav, MarketingShell |
| `portfolio/` | 포트폴리오 카드, 갤러리, 북마크 버튼, 연락 CTA |
| `portfolio-editor/` | 에디터 위저드 (이미지 업로더, 태그 셀렉터, 템플릿) |
| `search/` | 검색바, 필터 패널, 그리드, 정렬 드롭다운 |
| `messaging/` | 대화 목록, 메시지 버블 |
| `notifications/` | 알림 아이템 |
| `auth/` | 소셜 로그인 버튼 |

### 3.3 API 엔드포인트 (17개)

| 엔드포인트 | 기능 |
|-----------|------|
| `/api/v1/auth/sign-in` | 로그인 |
| `/api/v1/auth/sign-up` | 회원가입 |
| `/api/v1/me` | 내 정보 조회 |
| `/api/v1/me/profile` | 프로필 수정 |
| `/api/v1/me/avatar` | 아바타 업로드 |
| `/api/v1/portfolios` | 포트폴리오 목록 / 생성 |
| `/api/v1/portfolios/[portfolioId]` | 포트폴리오 상세 / 수정 / 삭제 |
| `/api/v1/portfolios/mine` | 내 포트폴리오 목록 |
| `/api/v1/bookmarks` | 북마크 CRUD |
| `/api/v1/conversations` | 대화 목록 |
| `/api/v1/conversations/direct` | 1:1 대화 생성/조회 |
| `/api/v1/messages/attachments` | 메시지 첨부파일 |
| `/api/v1/notifications` | 알림 목록 |
| `/api/v1/notifications/read-all` | 알림 전체 읽음 |
| `/api/v1/tags` | 태그 목록 |
| `/api/v1/templates` | 포트폴리오 템플릿 |
| `/api/v1/users/[userId]` | 사용자 프로필 조회 |

### 3.4 데이터베이스 마이그레이션 (18개)

```
01 extensions          → DB 확장 기능
02 enum_types          → 열거형 타입 정의
03 profiles            → 사용자 프로필 테이블
04 storage_buckets     → 스토리지 버킷 설정
05 portfolio_tables    → 포트폴리오 관련 테이블
06 portfolio_rpc       → 포트폴리오 RPC 함수
07 tag_seeds           → 태그 시드 데이터
08 portfolio_templates → 포트폴리오 템플릿 시드
09 storage_portfolio   → 포트폴리오 스토리지 버킷
10 messaging_tables    → 메시징 테이블
11 notifications       → 알림 테이블
12 messaging_rpc       → 메시징 RPC 함수
13 messaging_triggers  → 메시징 트리거
14 chat_storage        → 채팅 첨부파일 스토리지
15 hotfixes            → 핫픽스
16 verification_phase2 → 검증 2단계
17 fix_notify_trigger  → 알림 트리거 수정
18 fix_cp_rls          → RLS 정책 수정
```

### 3.5 Zod 스키마 (유효성 검증)

| 파일 | 대상 |
|------|------|
| `auth.ts` | 로그인/회원가입 입력 |
| `common.ts` | 공통 유효성 검증 |
| `messaging.ts` | 메시지 전송 |
| `portfolio.ts` | 포트폴리오 생성/수정 |
| `profile.ts` | 프로필 수정 |

### 3.6 와이어프레임

JSON 기반 와이어프레임이 `Wireframe/` 디렉토리에 존재하며 다음 페이지를 포함:

- 디자인 시스템, 홈 피드, 포트폴리오 에디터, 검색/탐색
- 포트폴리오 상세, 메시지, 사용자 프로필, 모바일 홈

---

## 4. 핵심 기능 구현 현황

| 기능 | 상태 | 비고 |
|------|------|------|
| 회원가입 / 로그인 | ✅ 완료 | Supabase Auth, 이메일 기반 |
| 온보딩 | ✅ 완료 | 역할 선택 (작가/의뢰인) |
| 프로필 관리 | ✅ 완료 | 아바타 업로드, 프로필 수정 |
| 포트폴리오 생성/수정 | ✅ 완료 | 위저드 형태, 이미지 업로드, 태그 |
| 포트폴리오 탐색 | ✅ 완료 | 검색, 필터, 정렬 |
| 포트폴리오 상세 | ✅ 완료 | 갤러리, 작가 정보, 연락 CTA |
| 북마크 | ✅ 완료 | 포트폴리오 저장/해제 |
| 1:1 메시징 | ✅ 완료 | 실시간 동기화, Optimistic UI, 한국어 IME 대응 |
| 알림 | ✅ 완료 | 드롭다운 UI, 전체 읽음 처리 |
| 랜딩 페이지 | ✅ 완료 | 마케팅 페이지 (비닐 레코드 컨셉 → revert됨) |
| 사용자 프로필 페이지 | ✅ 완료 | 공개 프로필 조회 |

---

## 5. 개발 타임라인

### Phase 1 — 초기 구축 (2026-03-22)
- 프로젝트 초기화, DB 스키마 설계
- 인증, 프로필, 포트폴리오 CRUD 구현
- 메시징, 알림, 북마크 기능 구현

### Phase 2 — QA 및 안정화 (2026-03-23)
- QA 이슈 일괄 수정 (P0/P1/P2)
- 메시지 전송 500 에러 수정
- 인증, 메시징, 필터, 북마크 관련 회귀 버그 해결
- 대화 API 안정화 (admin 클라이언트 기반)

### Phase 3 — UI/UX 고도화 (2026-03-24)
- Awwwards 수준의 UI 리디자인
- 실시간 메시지 동기화 (Supabase Realtime + 폴링 fallback)
- Optimistic UI 적용
- 한국어 IME 입력 처리 수정
- 알림 드롭다운 UI 추가
- 채팅 뷰포트 레이아웃 수정

### Phase 4 — 마무리 (2026-03-25)
- 포트폴리오 이미지 표시 및 인증 리디렉트 개선
- 메시지 내부 컨테이너 레이아웃
- 스튜디오 스타일 프로필 페이지
- 아바타 업로드 기능

---

## 6. 현재 작업 중인 변경사항 (미커밋)

현재 `main` 브랜치에 **스테이지되지 않은 변경 26건**이 존재한다:

### 삭제 예정 파일 (불필요한 문서 정리)
- `FIX_LOG.md`, `PRODUCTION_READY.md`, `QA_CHECKLIST.md`, `QA_REPORT.md`
- `VERIFICATION_REPORT.md`, `VERIFICATION_REPORT_FINAL.md`
- `docs/README.md`, `guide.md`

### 수정된 페이지/컴포넌트
- **랜딩 페이지** (`page.tsx`) — 대폭 축소 리팩토링 (526줄 삭감)
- **Explore 페이지** — 레이아웃/필터 개선
- **포트폴리오 상세 페이지** — 구조 변경
- **포트폴리오 생성 페이지** — 에디터 위저드 수정
- **설정 페이지** — 마이너 수정
- **Header** — 수정
- **Portfolio Card/Gallery** — 카드 UI 개선
- **Search 관련** — 필터 패널, 그리드, 검색바, 정렬 수정
- **Contact CTA** — 연락 CTA 컴포넌트 수정
- **Button (UI)** — 마이너 수정
- **Explore Store** — Zustand 상태 관리 리팩토링
- **Portfolios API** — API 로직 수정

### 신규 파일
- `CLAUDE.md` — 프로젝트 컨벤션 문서
- `README.md` — 프로젝트 소개
- `UI_UX_report.md` — UI/UX 보고서
- `users/[userId]/loading.tsx` — 로딩 컴포넌트

---

## 7. 브랜치 현황

| 브랜치 | 설명 |
|--------|------|
| `main` | 메인 브랜치 (활성) |
| `landing` | 랜딩 페이지 실험 브랜치 (로컬 + 리모트) |

---

## 8. 소스코드 규모

| 항목 | 수량 |
|------|------|
| TypeScript/TSX 파일 수 | 121개 |
| 컴포넌트 파일 수 | 40개 |
| API 엔드포인트 수 | 17개 |
| DB 마이그레이션 수 | 18개 |
| Zod 스키마 수 | 5개 |
| 총 커밋 수 | 46개 |

---

## 9. 아키텍처 특징

### 데이터 흐름
```
Client (React) → Zustand (클라이언트 상태)
                → TanStack Query (서버 상태 캐싱)
                → Next.js API Routes (/api/v1/*)
                → Supabase (Auth + Postgres + Storage)
```

### 보안
- Supabase RLS(Row Level Security) 활성화
- 서버 컴포넌트에서 `server-client`, Route Handler에서 적절한 클라이언트 사용
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 (`admin-client`)
- Zod 스키마로 모든 입력값 검증

### 컨벤션
- DB 컬럼: `snake_case` → API/프론트엔드: `camelCase` (mapper 활용)
- 커서 기반 페이지네이션 (base64 encoded cursor)
- 통일된 API 응답 형식 (`success()` / `error()` 헬퍼)
- Three.js/R3F 코드는 `"use client"` + dynamic import로 SSR 회피

---

## 10. 향후 고려사항

- **테스트 코드 부재**: 현재 단위 테스트/통합 테스트가 없으므로 테스트 프레임워크 도입 필요
- **CI/CD 파이프라인**: 자동화된 빌드/배포 파이프라인 미구성
- **성능 최적화**: 이미지 최적화, 번들 사이즈 분석, Lighthouse 점검
- **접근성(a11y)**: 스크린리더, 키보드 내비게이션 등 접근성 점검 필요
- **국제화(i18n)**: 현재 한국어 하드코딩 → 다국어 지원 시 i18n 라이브러리 도입 고려
- **모니터링/로깅**: 에러 트래킹(Sentry 등), 사용자 행동 분석 도구 미적용
- **랜딩 페이지**: 비닐 레코드 컨셉이 revert된 상태로, 새로운 랜딩 디자인 방향 결정 필요
