# DrawMate 최종 검증 리포트 (수정 반영 후)

작성일: 2026-03-23 (Asia/Seoul)  
검증 대상: `DrawMate` 전체 코드베이스 (수정 반영본)  
검증 방식: 정적 분석 + 실행 검증

## 전체 요약
- 총 발견 이슈 수: **8건**
  - 🔴 Critical: **0**
  - 🟠 High: **0**
  - 🟡 Medium: **6**
  - 🔵 Low: **2**
- 빌드 성공 여부: **성공** (`npm run build`)
- TypeScript 에러 수: **0** (`npx tsc --noEmit`)
- ESLint 결과: **통과** (`npm run lint`)
- 순환 참조: **없음** (`npx madge --extensions ts,tsx --circular src`)

### Critical / High 이슈 요약
- 없음 (요청 범위 내 🔴/🟠 이슈 수정 완료)

---

### 1. 프로젝트 구조 & 의존성 검증

실행 근거:
- `npx tsc --noEmit` → 에러 0
- `npm run lint` → 통과
- `npm run build` → 성공
- `npx depcheck --json` → 미사용 의존성 후보 탐지

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟡 Medium | `.env.local.example`, `src/app/robots.ts`, `src/app/sitemap.ts` | 1-3, 4, 5 | 코드에서 `NEXT_PUBLIC_SITE_URL`을 사용하지만 샘플 env에 정의가 없습니다. | 환경별 sitemap/robots 도메인 오설정 가능 | `.env.example` 또는 `.env.local.example`에 `NEXT_PUBLIC_SITE_URL` 추가 |
| 2 | 🔵 Low | `.env.local.example` | 3 | `SUPABASE_SERVICE_ROLE_KEY`가 샘플에 존재하지만 코드 사용처가 없습니다. | 운영 변수 관리 혼선 | 실제 사용 계획이 없으면 제거, 있으면 서버 전용 경로 문서화 |
| 3 | 🟡 Medium | `package.json` | 13-18, 29, 34, 40 | `depcheck` 기준 미사용 의존성 후보가 남아 있습니다(`@sentry/nextjs`, `@vercel/analytics`, `@vercel/speed-insights`, `tw-animate-css`, 일부 devDependencies 후보). | 번들/설정 복잡도 증가 | 실제 적용 또는 의존성 정리(오탐 여부 확인 후 반영) |

---

### 2. 라우팅 & 네비게이션 검증

검증 결과:
- `/reset-password` 라우트 구현됨
- 보호 라우트 진입 시 `next` 전달 및 로그인/온보딩 후 소비 동작 확인
- `(app)`, `(marketing)`에 `loading.tsx`/`error.tsx`/`not-found.tsx` 추가됨

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 0 | - | - | - | 현재 검증 범위에서 신규 라우팅/네비게이션 결함 미발견 | - | - |

---

### 3. 컴포넌트 & 상태관리 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟡 Medium | `src/components/portfolio-editor/image-uploader.tsx` | 95-107 | 업로드 완료 매핑이 배열 인덱스 기반이라 중간 삭제/재정렬 시 잘못된 이미지에 ID가 연결될 가능성이 남아 있습니다. | 이미지 메타데이터 꼬임 가능성 | 임시 클라이언트 UUID 키로 업로드 결과를 매핑 |

---

### 4. API & 데이터 흐름 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🟡 Medium | `src/app/api/v1/conversations/direct/route.ts` | 55-64 | 기존 대화 재사용 시 초기 메시지 insert 결과를 검사하지 않고 성공 응답을 반환합니다. | 사용자 체감 전송 성공/실패 불일치 가능 | insert 에러 검증 후 실패 응답 반환 |
| 2 | 🟡 Medium | `src/app/api/v1/portfolios/route.ts` | 341, 398 | 내부 에러 상세(`authError.message`, DB code/hint)를 응답 메시지에 노출합니다. | 내부 구조 정보 노출 가능 | 서버 로그에만 상세 기록, 클라이언트엔 일반화된 메시지 반환 |
| 3 | 🟡 Medium | `src/app/api/v1/portfolios/route.ts`, `src/app/api/v1/conversations/route.ts`, `src/app/api/v1/conversations/[conversationId]/messages/route.ts`, `src/app/api/v1/notifications/route.ts` | 214, 103, 146, 60 | 커서 페이지네이션에 `.or(...)` 문자열 조합을 사용합니다. 입력 escaping/타입 보강이 부족합니다. | 필터 조작/예외 유도 리스크 | 안전한 typed 비교식 기반 커서 조건으로 분리 |

---

### 5. 인증 & 권한 검증

검증 결과:
- 로그인/온보딩 `next` 복귀 플로우 동작
- 프로필 DELETE API + 정책 추가됨
- 소셜 콜백 `next` sanitize 적용됨

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 0 | - | - | - | 현재 검증 범위에서 신규 인증/권한 결함 미발견 | - | - |

---

### 6. CRUD 전체 플로우 검증

검증 결과:
- 포트폴리오/북마크/메시지/알림/프로필 CRUD에서 기존 🔴/🟠 결함 해소 확인
- 프로필 DELETE 플로우가 코드 레벨에서 구현됨

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 0 | - | - | - | 요청 우선순위 대상(Critical/High + UX Medium) 기준 미해결 결함 미발견 | - | - |

---

### 7. UI/UX 품질 검증

검증 결과:
- 알림 버튼 라우팅/실시간 unread 반영
- 개별 알림 읽음 처리 연결
- 알림 설정 서버 저장 연동
- 접근성(aria-label, 대화 목록 버튼화) 및 다크모드 토큰 일부 보완
- 실패 피드백 토스트 일관성 보강

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 0 | - | - | - | 이번 라운드의 UX 우선순위 항목 내 신규 결함 미발견 | - | - |

---

### 8. 성능 & 보안 검증

| # | 심각도 | 파일 | 라인 | 문제 설명 | 영향 범위 | 권장 수정 방법 |
|---|--------|------|------|-----------|-----------|----------------|
| 1 | 🔵 Low | `src/components/portfolio-editor/template-selector.tsx`, `src/components/portfolio-editor/image-uploader.tsx`, `src/components/messaging/message-input.tsx`, `src/app/(app)/studio/page.tsx`, `src/app/(app)/studio/portfolios/page.tsx` | 82, 217, 78, 144, 166 | 일부 화면에서 여전히 `img` 태그를 직접 사용합니다. | 이미지 최적화/CLS 손해 | `next/image` 전환 또는 예외 사유 문서화 |

보안 추가 확인:
- `dangerouslySetInnerHTML` 사용처 없음
- 클라이언트 하드코딩 시크릿 탐지 없음
- SQL 문자열 직접 결합은 없으나 커서 `.or(...)` 문자열 조합은 상기 Medium 이슈로 잔존

---

## 수정 우선순위 로드맵

### Phase A: Critical + High (즉시 수정 필요)
1. 없음 (완료)

### Phase B: Medium (기능 안정화)
1. `.or(...)` 커서 문자열 조합 제거(typed 비교식 전환)
2. 내부 DB/인증 상세 에러 메시지 클라이언트 노출 제거
3. direct conversation 재사용 시 초기 메시지 insert 실패 검증 추가
4. 이미지 업로드 완료 매핑을 인덱스 기반에서 UUID 키 기반으로 전환
5. env 샘플(`NEXT_PUBLIC_SITE_URL`) 정합성 보강
6. depcheck 미사용 의존성 후보 정리

### Phase C: Low (품질 개선)
1. 샘플 env의 미사용 `SUPABASE_SERVICE_ROLE_KEY` 정리
2. 잔여 `img` 태그 구간 `next/image` 전환
