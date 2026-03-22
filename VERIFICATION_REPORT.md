# DrawMate 검증 리포트 (코드 수정 없음)

작성일: 2026-03-23 (Asia/Seoul)  
검증 대상: `DrawMate` 전체 코드베이스  
검증 방식: 정적 분석 + 실행 검증

## 전체 요약
- 총 발견 이슈 수: **27건**
  - 🔴 Critical: **1**
  - 🟠 High: **10**
  - 🟡 Medium: **14**
  - 🔵 Low: **2**
- 빌드 성공 여부: **성공** (`npm run build`)
- TypeScript 에러 수: **0** (`npx tsc --noEmit`)
- ESLint 결과: **통과** (`npm run lint`)
- 순환 참조: **없음** (`npx madge --extensions ts,tsx --circular src`)

### Critical / High 이슈 요약
- 🔴 자동 저장이 실패해도 성공으로 표시되고 `isDirty`가 해제되어 **편집 데이터 유실 위험**이 있습니다.
- 🟠 로그인 페이지에 `/reset-password` 링크가 있으나 실제 라우트가 없어 **즉시 404**가 발생합니다.
- 🟠 미인증 리다이렉트의 `next` 파라미터가 로그인 후 소비되지 않아 **원래 페이지 복귀가 불가**합니다.
- 🟠 이미지 제거가 클라이언트 상태에서만 수행되어 **DB/Storage와 UI 상태가 불일치**합니다.
- 🟠 포트폴리오 목록 API가 `thumbnailUrl`을 항상 `null`로 반환해 **탐색 카드 썸네일이 깨집니다**.
- 🟠 다중 카테고리 태그 필터가 같은 조인 경로에 중첩되어 **검색 결과가 비정상적으로 비거나 누락**됩니다.
- 🟠 포트폴리오 태그 동기화가 delete→insert 비트랜잭션이라 **중간 실패 시 태그 손실**이 발생합니다.
- 🟠 북마크 row 변경과 카운터 RPC가 비트랜잭션이라 **북마크 수 불일치**가 발생할 수 있습니다.
- 🟠 메시지 첨부파일이 private 경로만 내려오고 UI는 `imageUrl`을 강제로 `null`로 처리해 **이미지 메시지 표시가 불가**합니다.
- 🟠 프로필 CRUD에서 삭제(DELETE) 플로우가 없어 **요구된 CRUD 완결성을 충족하지 못합니다**.
- 🟠 대화 목록 API가 `messages`를 과다 조인하고 N+1 쿼리를 수행해 **대화 수 증가 시 성능 저하가 큽니다**.

---

### 1. 프로젝트 구조 & 의존성 검증

실행 근거:
- `npx tsc --noEmit` → 에러 0
- `npm run lint` → 통과
- `npm run build` → 성공
- `npm ls --all` → 치명적 의존성 충돌 없음
- `npx depcheck --json` → 미사용 의존성 후보 탐지

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟡 Medium | `.env.local.example`, `src/app/robots.ts`, `src/app/sitemap.ts` | 1-3, 4-5 | 코드에서 `NEXT_PUBLIC_SITE_URL`을 사용하지만 샘플 env에 정의가 없고, 요청 기준 파일명(`.env.example`)도 부재합니다. | 환경별 URL 설정 누락 시 sitemap/robots 도메인 오작동 | `.env.example`(또는 현재 정책상 `.env.local.example`)에 `NEXT_PUBLIC_SITE_URL`을 추가하고 README에 기준 파일명을 명시 |
| 2 | 🔵 Low | `.env.local.example` | 3 | `SUPABASE_SERVICE_ROLE_KEY`가 샘플에 존재하지만 코드 사용처가 없습니다. | 운영 설정 혼선, 불필요한 민감정보 관리 포인트 증가 | 사용 계획이 없다면 제거, 계획이 있다면 서버 전용 경로/사용처를 명확히 문서화 |
| 3 | 🟡 Medium | `package.json` | 13, 17-18 | `depcheck` 기준 `@sentry/nextjs`, `@vercel/analytics`, `@vercel/speed-insights`가 미사용 상태입니다. | 번들/설정 복잡도 증가, 유지보수 비용 증가 | 실제 적용(초기화 파일/컴포넌트 삽입) 또는 의존성 제거 |

---

### 2. 라우팅 & 네비게이션 검증

#### App Router 라우트 목록
- 페이지 라우트: `/`, `/explore`, `/portfolio/[portfolioSlug]`, `/users/[userId]`, `/sign-in`, `/sign-up`, `/onboarding`, `/studio`, `/studio/portfolios`, `/studio/portfolios/new`, `/studio/portfolios/[portfolioId]/edit`, `/messages`, `/messages/[conversationId]`, `/notifications`, `/bookmarks`, `/settings`, `/settings/profile`, `/settings/account`, `/settings/notifications`
- 기타 라우트: `/auth/callback`, `/robots.txt`, `/sitemap.xml`
- API 라우트: `/api/v1/auth/*`, `/api/v1/me*`, `/api/v1/portfolios*`, `/api/v1/conversations*`, `/api/v1/messages/attachments`, `/api/v1/notifications*`, `/api/v1/bookmarks`, `/api/v1/tags`, `/api/v1/templates`, `/api/v1/users/[userId]`

#### 페이지 라우트별 직접 의존성 트리(직접 import 기준)
| 라우트 | 직접 의존 컴포넌트 |
|---|---|
| `/` | `PortfolioCard`, `Button`, `Badge` |
| `/explore` | `SearchBar`, `FilterPanel`, `SortDropdown`, `PortfolioGrid`, `Sheet` |
| `/portfolio/[portfolioSlug]` | `OwnerCard`, `PortfolioGallery`, `TagChips`, `BookmarkButton`, `ContactCta` |
| `/users/[userId]` | `Avatar`, `Badge`, `Card`, `Tabs` |
| `/sign-in` | `SocialLoginButtons`, `Card`, `Input`, `Button` |
| `/sign-up` | `SocialLoginButtons`, `Card`, `Input`, `Button` |
| `/onboarding` | `Card`, `Input`, `Button` |
| `/studio` | `Card`, `Badge`, `Button` |
| `/studio/portfolios` | `Tabs`, `Card`, `Badge`, `Button` |
| `/studio/portfolios/new` | `EditorWizard` |
| `/studio/portfolios/[portfolioId]/edit` | `EditorWizard` |
| `/messages` | `ConversationList` |
| `/messages/[conversationId]` | `ConversationList`, `MessageBubble`, `MessageInput` |
| `/notifications` | `NotificationItem`, `ScrollArea`, `Button` |
| `/bookmarks` | `PortfolioCard`, `Skeleton` |
| `/settings` | `Switch`, `Card`, `Button` |
| `/settings/profile` | `Input`, `Select`, `Card`, `Button` |
| `/settings/account` | `Input`, `Card` |
| `/settings/notifications` | `Checkbox`, `Card` |

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟠 High | `src/app/(auth)/sign-in/page.tsx` | 117 | `href="/reset-password"` 링크가 존재하지만 실제 라우트 파일이 없습니다. | 로그인 화면에서 즉시 404 | `/reset-password` 라우트 구현 또는 링크 제거 |
| 2 | 🟠 High | `src/proxy.ts`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/onboarding/page.tsx` | 24-25, 45-47, 52 | 미인증 접근 시 `next` 쿼리를 부여하지만 로그인/온보딩 완료 후 해당 `next`를 사용하지 않아 원래 페이지 복귀가 불가합니다. | 보호 라우트 접근 UX 붕괴, 이탈 증가 | 로그인 성공/온보딩 완료 시 `next`를 읽어 우선 이동하도록 수정 |
| 3 | 🟡 Medium | `src/components/layout/header.tsx` | 103-108 | 알림 아이콘 버튼이 라우트 이동과 연결되어 있지 않고 unread 배지도 고정값(3)입니다. | 알림 진입 경로 부재, 잘못된 상태 표시 | `/notifications` 링크 연결 + unread count를 API 기반으로 렌더링 |
| 4 | 🟡 Medium | `src/app` | - | 세그먼트별 `loading.tsx`, `error.tsx`, `not-found.tsx`가 없습니다. | 네트워크 실패/예외 시 UX 일관성 저하 | 주요 그룹(`(app)`, `(marketing)`)에 로딩/에러/404 경계 추가 |

---

### 3. 컴포넌트 & 상태관리 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🔴 Critical | `src/components/portfolio-editor/editor-wizard.tsx` | 77-83 | `saveDraft`가 `fetch` 응답의 `res.ok`를 검사하지 않고 항상 `lastSaved` 갱신 + `isDirty=false`로 처리합니다. 저장 실패를 성공으로 오인합니다. | 포트폴리오 수정 데이터 유실, 게시 전 잘못된 상태 확정 | `res.ok`/에러 바디 검증 후에만 `isDirty=false` 처리, 실패 시 토스트/재시도 유지 |
| 2 | 🟠 High | `src/components/portfolio-editor/image-uploader.tsx` | 240 | 이미지 삭제가 `removeImage(index)`로 로컬 스토어에서만 처리되고 서버 `DELETE /images/[imageId]`를 호출하지 않습니다. | UI와 DB/Storage 불일치, 스토리지 누수 | `id`가 있는 이미지 제거 시 서버 삭제 API 먼저 호출 후 성공 시 로컬 제거 |
| 3 | 🟡 Medium | `src/components/portfolio-editor/image-uploader.tsx` | 94, 104-107 | 업로드 완료 콜백이 배열 인덱스 기반으로 `updateImage(index)`를 호출해 중간 삭제/재정렬 시 다른 이미지에 ID가 잘못 매핑될 수 있습니다. | 이미지 메타데이터 꼬임, 이후 편집/삭제 오류 | 임시 클라이언트 UUID를 키로 사용해 업로드 결과를 매핑 |

---

### 4. API & 데이터 흐름 검증

#### 프론트에서 호출하는 API 엔드포인트 목록
- `/api/v1/auth/sign-up`
- `/api/v1/me/profile`
- `/api/v1/portfolios`
- `/api/v1/portfolios/mine`
- `/api/v1/portfolios/{portfolioId}`
- `/api/v1/portfolios/{portfolioId}/publish`
- `/api/v1/portfolios/{portfolioId}/bookmark`
- `/api/v1/portfolios/{portfolioId}/images`
- `/api/v1/conversations`
- `/api/v1/conversations/direct`
- `/api/v1/conversations/{conversationId}/messages`
- `/api/v1/notifications`
- `/api/v1/notifications/read-all`
- `/api/v1/bookmarks`
- `/api/v1/tags`
- `/api/v1/templates`

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟠 High | `src/app/api/v1/portfolios/route.ts` | 186 | 목록 응답에서 `thumbnailUrl`을 하드코딩으로 `null` 반환합니다. | 탐색/검색/북마크 카드 썸네일 미노출 | cover image 조인 또는 대표 이미지 서브쿼리로 실제 썸네일 URL 반환 |
| 2 | 🟠 High | `src/app/api/v1/portfolios/route.ts` | 95-106 | 카테고리별 태그 필터를 동일 조인 경로(`portfolio_tags.tags.slug`)에 연속 `.in(...)` 적용하여 다중 카테고리 AND가 비정상 동작할 가능성이 큽니다. | 태그 검색 정확도 하락, 결과 누락 | 카테고리별 별도 서브쿼리/RPC 또는 EXISTS 기반 필터로 분리 |
| 3 | 🟠 High | `src/app/api/v1/portfolios/[portfolioId]/route.ts` | 191-202 | 태그 동기화가 `delete` 후 `insert`로 분리되어 있고 트랜잭션이 없습니다. | 중간 실패 시 태그 전부 삭제된 상태로 잔존 | DB 함수(RPC)로 원자적 upsert 처리 |
| 4 | 🟠 High | `src/app/api/v1/portfolios/[portfolioId]/bookmark/route.ts` | 42-56, 88-104 | 북마크 row 변경과 `bookmark_count` RPC가 분리되어 실패 시 카운트와 실제 row가 불일치합니다. | 북마크 수 신뢰성 저하 | 단일 트랜잭션 함수로 row + counter 동시 처리 |
| 5 | 🟠 High | `src/app/api/v1/conversations/[conversationId]/messages/route.ts`, `src/app/(app)/messages/[conversationId]/page.tsx` | 42-50, 53-59 | API는 private `storage_path`만 반환하고, 프론트는 `imageUrl`을 강제로 `null`로 세팅합니다. 첨부 이미지 메시지가 렌더되지 않습니다. | 채팅 첨부 이미지 기능 사실상 미동작 | 서버에서 signed URL 생성 후 `imageUrl` 반환, 클라이언트 매핑 반영 |
| 6 | 🟡 Medium | `src/app/api/v1/conversations/direct/route.ts` | 55-64 | 기존 대화방 재사용 시 초기 메시지 `insert` 실패를 검사하지 않고 성공 응답을 반환합니다. | 사용자 입장에서는 전송 성공처럼 보이나 실제 메시지 누락 가능 | `insert` 결과 검증 후 실패 시 에러 반환 |
| 7 | 🟡 Medium | `src/app/api/v1/portfolios/route.ts`, `src/app/api/v1/portfolios/[portfolioId]/route.ts` | 266, 187 | 내부 DB 에러 메시지/코드/힌트를 클라이언트로 그대로 노출합니다. | 내부 스키마/운영 정보 노출 | 서버 로그에는 상세 기록, 클라이언트에는 일반화된 메시지만 반환 |
| 8 | 🟡 Medium | `src/app/api/v1/portfolios/route.ts`, `src/app/api/v1/conversations/route.ts`, `src/app/api/v1/conversations/[conversationId]/messages/route.ts`, `src/app/api/v1/notifications/route.ts` | 116-118, 81-83, 131-133, 60-62 | 사용자 입력(cursor)을 문자열 `.or(...)`에 직접 조합합니다. 값 escaping이 없어 필터 조작/예외 유도 위험이 있습니다. | 데이터 조회 안정성/보안성 저하 | cursor 파싱 후 안전한 비교 연산(typed column filter)으로 분해 구현 |

---

### 5. 인증 & 권한 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟡 Medium | `src/app/(auth)/sign-up/page.tsx`, `src/app/api/v1/auth/sign-up/route.ts` | 46-47, 51 | 회원가입 응답의 `emailVerificationRequired` 여부를 클라이언트가 무시하고 바로 `/onboarding`으로 이동시킵니다. | 이메일 인증 필요 계정에서 혼란/리다이렉트 루프 가능 | 응답 플래그 기반으로 안내 화면 분기 (인증 메일 확인 안내) |
| 2 | 🟡 Medium | `src/app/(app)/settings/page.tsx` | 13, 17-25 | `isProfilePublic` 초기값이 하드코딩(`true`)이고 서버 실데이터를 로드하지 않아 토글 시 의도치 않게 덮어쓸 수 있습니다. | 프로필 공개/비공개 권한 상태 오염 | 초기 렌더 시 `/api/v1/me` 또는 `/api/v1/me/profile` GET으로 실제 상태 hydrate |

---

### 6. CRUD 전체 플로우 검증

#### 플로우 추적 결과 요약
| 기능 | 생성(Create) | 조회(Read) | 수정(Update) | 삭제(Delete) | 실패 처리 | 옵티미스틱 롤백 | DB↔UI 반영 일치 |
|---|---|---|---|---|---|---|---|
| 포트폴리오(이미지 포함) | 동작 | 동작 | **위험** | 부분 동작 | 부분 | 일부 | **불일치 위험** |
| 사용자 프로필 | 동작(트리거) | 동작 | 동작 | **미구현** | 부분 | 해당 없음 | 부분 |
| 메시지/채팅 | 동작 | 동작 | 해당 없음 | 해당 없음 | 부분 | 해당 없음 | **불일치(첨부/정렬)** |
| 북마크 | 동작 | 동작 | 해당 없음 | 동작 | 부분 | 있음(UI) | **카운터 불일치 위험** |
| 태그 필터/검색 | 해당 없음 | 동작 | 해당 없음 | 해당 없음 | 부분 | 해당 없음 | **필터 정확도 이슈** |
| 알림 생성/읽음 | 생성 동작(트리거) | 동작 | 부분(전체 읽음) | 해당 없음 | 부분 | 해당 없음 | 부분 |

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟠 High | `src/app/api/v1/me/profile/route.ts` | 1-50 | 프로필 API에 `PATCH`만 있고 `DELETE` 플로우가 없어 요구된 Profile CRUD가 완결되지 않습니다. | 계정/개인정보 정리 요구 미충족 | 프로필 삭제(또는 비활성화) 정책 정의 후 DELETE 엔드포인트와 UI 제공 |
| 2 | 🟡 Medium | `src/app/api/v1/notifications/[notificationId]/read/route.ts`, `src/app/(app)/notifications/page.tsx`, `src/app/(app)/settings/notifications/page.tsx` | 4-52, 57-78, 7-57 | 개별 읽음 API는 존재하나 UI가 호출하지 않고, 알림 설정도 서버 반영이 없어 CRUD 흐름이 부분 구현입니다. | 알림 읽음/설정의 사용자 기대 불일치 | 개별 읽음 액션 연결 + 알림 설정 저장 API 연동 |

---

### 7. UI/UX 품질 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟡 Medium | `src/components/layout/header.tsx`, `src/components/messaging/message-input.tsx`, `src/app/(app)/messages/[conversationId]/page.tsx`, `src/components/messaging/conversation-list.tsx` | 103-116, 97-123, 112-117, 108-114 | 아이콘 버튼의 `aria-label` 누락, 클릭 가능한 `<li>` 사용으로 키보드 접근성이 떨어집니다. | 스크린리더/키보드 사용자 사용성 저하 | 아이콘 버튼에 `aria-label` 추가, 목록 아이템을 `<button>/<a>`로 전환 |
| 2 | 🟡 Medium | `src/components/layout/header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/(auth)/layout.tsx`, `src/components/portfolio-editor/editor-wizard.tsx` | 77-92, 20-31, 10, 150/201 | `bg-white`, `text-gray-*` 등 하드코딩 색상이 많아 다크 모드 변수 체계와 충돌합니다. | 다크 모드 시 가독성/일관성 저하 | 토큰 기반 클래스(`bg-background`, `text-foreground`)로 치환 |
| 3 | 🟡 Medium | `src/components/portfolio/contact-cta.tsx`, `src/components/messaging/message-input.tsx`, `src/app/(app)/studio/portfolios/page.tsx`, `src/app/(app)/studio/page.tsx` | 29-30, 55-56, 64, 44 | 실패 시 `console.error`/`alert` 위주 처리로 사용자 피드백 일관성이 없습니다. | 실패 원인 파악 어려움, UX 품질 저하 | 공통 토스트/에러 배너 정책으로 통일 |

---

### 8. 성능 & 보안 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟠 High | `src/app/api/v1/conversations/route.ts` | 66-69, 103-145 | 대화 목록 API가 메시지 관계를 넓게 조인하고(과다 row), 대화별 추가 쿼리(N+1)를 수행합니다. | 대화 수 증가 시 응답 지연/DB 부하 급증 | 마지막 메시지/상대 프로필/unread를 단일 쿼리(RPC 또는 materialized view)로 집약 |
| 2 | 🔵 Low | `src/components/portfolio-editor/template-selector.tsx`, `src/components/portfolio-editor/image-uploader.tsx`, `src/components/messaging/message-input.tsx`, `src/app/(app)/studio/page.tsx`, `src/app/(app)/studio/portfolios/page.tsx` | 82-86, 193-197, 74-77, 124-128, 145-149 | 여러 화면에서 `img` 태그를 직접 사용하고 `next/image` 최적화를 우회합니다. | 이미지 최적화/캐싱/CLS 측면 손해 | 가능하면 `next/image` 전환, 불가 시 이유 문서화 및 사이즈/로딩 전략 보강 |

보안 추가 확인:
- `dangerouslySetInnerHTML` 사용처 없음
- 하드코딩된 API 키/시크릿 탐지되지 않음
- Supabase 쿼리에서 직접 SQL 문자열 결합은 없으나, 커서 기반 `.or(...)` 문자열 조합은 위 이슈(#4-8)로 별도 리스크 존재

---

## 수정 우선순위 로드맵

### Phase A: Critical + High (즉시 수정 필요)
1. 자동저장 성공 오탐 및 dirty 플래그 처리 수정 (`editor-wizard.tsx`)
2. 깨진 라우트(`/reset-password`) 정리
3. 로그인 후 `next` 복귀 동선 복원
4. 이미지 삭제 서버 연동 및 상태 정합성 복구
5. 포트폴리오 목록 썸네일 반환 수정
6. 태그 다중 필터 로직 교정
7. 태그 동기화/북마크 카운터 트랜잭션화
8. 첨부 메시지 URL 반환 + 프론트 렌더 반영
9. 프로필 DELETE 플로우 정의 및 구현
10. 대화 목록 API N+1/과다 조인 제거

### Phase B: Medium (기능 안정화)
1. env 샘플 정비 (`NEXT_PUBLIC_SITE_URL`, 파일명 규약)
2. 헤더 알림 버튼 실데이터 연동
3. 에러/로딩/404 경계 컴포넌트 추가
4. direct conversation 기존방 초기 메시지 실패 처리
5. 내부 DB 에러 노출 제거
6. `.or(...)` cursor 조합 안전화
7. 회원가입 후 이메일 인증 분기 반영
8. 프로필 공개 토글 초기 hydrate
9. 알림 개별 읽음 + 설정 저장 연동
10. 접근성(aria-label, 키보드 내비게이션) 및 다크모드 토큰 정리
11. 실패 피드백(토스트/배너) 통일

### Phase C: Low (품질 개선)
1. 미사용 env 키 정리
2. `img` 직접 사용 구간 `next/image` 전환 또는 예외 최소화

