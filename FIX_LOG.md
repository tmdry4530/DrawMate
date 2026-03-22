# DrawMate Fix Log

| 이슈 번호 | 수정 파일 | 변경 내용 |
|---|---|---|
| 3-1 (🔴) | `src/components/portfolio-editor/editor-wizard.tsx` | 임시저장에서 `res.ok` 검증 추가, 실패 시 `isDirty` 유지/토스트 처리, 스텝 이동/게시/종료 시 저장 실패 차단 |
| 2-1 (🟠) | `src/app/(auth)/reset-password/page.tsx` | 누락된 `/reset-password` 페이지 구현 (이메일 기반 재설정 요청) |
| 2-2 (🟠) | `src/proxy.ts`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/onboarding/page.tsx`, `src/components/auth/social-login-buttons.tsx`, `src/app/auth/callback/route.ts` | 보호 라우트 `next` 전달/소비 복구, 소셜 로그인 콜백에도 `next` 전달, 콜백 `next` 경로 sanitize 적용 |
| 3-2 (🟠) | `src/components/portfolio-editor/image-uploader.tsx` | 이미지 삭제 시 서버 `DELETE /images/[imageId]` 호출 후 성공 시 로컬 상태 반영하도록 변경 |
| 4-1 (🟠) | `src/app/api/v1/portfolios/route.ts` | 목록 API에서 `portfolio_images` 조회를 통해 실제 `thumbnailUrl` 생성/반환 |
| 4-2 (🟠) | `src/app/api/v1/portfolios/route.ts` | 카테고리별 태그 필터를 개별 집합 조회 후 교집합 적용 방식으로 교정 |
| 4-3 (🟠) | `src/app/api/v1/portfolios/[portfolioId]/route.ts`, `supabase/migrations/2026032300000016_verification_phase2.sql` | 태그 동기화를 `replace_portfolio_tags` RPC로 원자 처리 |
| 4-4 (🟠) | `src/app/api/v1/portfolios/[portfolioId]/bookmark/route.ts`, `supabase/migrations/2026032300000016_verification_phase2.sql` | 북마크 row/카운트 동기화를 `toggle_portfolio_bookmark` RPC 단일 트랜잭션으로 변경 |
| 4-5 (🟠) | `src/app/api/v1/conversations/[conversationId]/messages/route.ts`, `src/app/(app)/messages/[conversationId]/page.tsx` | 첨부파일 signed URL(`imageUrl`) 반환 및 클라이언트 이미지 렌더 매핑 수정 |
| 6-1 (🟠) | `src/app/api/v1/me/profile/route.ts`, `src/app/(app)/settings/account/page.tsx`, `supabase/migrations/2026032300000016_verification_phase2.sql` | 프로필 DELETE API/설정 UI 추가 + `profiles` DELETE RLS 정책 추가 |
| 8-1 (🟠) | `src/app/api/v1/conversations/route.ts` | 대화 목록 API에서 과다 메시지 조인/N+1 제거: 대화·참여자·프로필·unread 집계 쿼리 구조로 재작성 |
| 2-3 (🟡 UX) | `src/components/layout/header.tsx` | 알림 버튼을 `/notifications`로 연결, unread badge를 API 기반 동적 렌더링 |
| 2-4 (🟡 UX) | `src/app/(app)/loading.tsx`, `src/app/(app)/error.tsx`, `src/app/(app)/not-found.tsx`, `src/app/(marketing)/loading.tsx`, `src/app/(marketing)/error.tsx`, `src/app/(marketing)/not-found.tsx` | 세그먼트별 loading/error/not-found 경계 추가 |
| 5-1 (🟡 UX) | `src/app/(auth)/sign-up/page.tsx` | 회원가입 응답의 `emailVerificationRequired` 분기 반영 (인증 필요 시 로그인 안내) |
| 5-2 (🟡 UX) | `src/app/api/v1/me/route.ts`, `src/app/(app)/settings/page.tsx` | `isProfilePublic` 서버값 hydrate 후 토글 적용 |
| 6-2 (🟡 UX) | `src/app/(app)/notifications/page.tsx`, `src/components/notifications/notification-item.tsx`, `src/app/(app)/settings/notifications/page.tsx`, `src/validators/profile.ts`, `src/app/api/v1/me/route.ts`, `supabase/migrations/2026032300000016_verification_phase2.sql` | 개별 알림 읽음 연결 + 알림 설정 서버 저장(신규 프로필 컬럼) 연동 |
| 7-1 (🟡 UX) | `src/components/layout/header.tsx`, `src/components/messaging/message-input.tsx`, `src/app/(app)/messages/[conversationId]/page.tsx`, `src/components/messaging/conversation-list.tsx` | 아이콘 버튼 `aria-label` 추가, 클릭 가능한 목록 항목을 `<button>` 구조로 변경 |
| 7-2 (🟡 UX) | `src/components/layout/header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/(auth)/layout.tsx`, `src/components/portfolio-editor/editor-wizard.tsx`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx` | 하드코딩 색상(`bg-white`, `text-gray-*`)을 토큰 기반 클래스 중심으로 치환 |
| 7-3 (🟡 UX) | `src/components/portfolio/contact-cta.tsx`, `src/components/messaging/message-input.tsx`, `src/app/(app)/studio/page.tsx`, `src/app/(app)/studio/portfolios/page.tsx`, `src/app/(app)/notifications/page.tsx` | `console.error/alert` 기반 실패 처리를 토스트/일관 메시지 기반으로 통일 |
