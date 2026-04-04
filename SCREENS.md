# DrawMate 미적용 화면 기능 구성 문서

> Stitch 와이어프레임 생성을 위한 기능/구조 참고 문서.
> 아래 7개 화면은 아직 Stitch 디자인이 적용되지 않은 상태.

---

## 1. 헤더 (Header)

**파일**: `src/components/layout/header.tsx`
**사용 위치**: 모든 (app), (marketing) 페이지 상단 고정

### 구조

```
┌──────────────────────────────────────────────────────────┐
│ [DrawMate 로고]  탐색  메시지  스튜디오*   [🔍검색] [🔔] [👤] │
└──────────────────────────────────────────────────────────┘
* 스튜디오 링크는 로그인 시에만 표시
* 비로그인: [로그인] [시작하기] 버튼
```

### 좌측 영역
| 요소 | 설명 |
|------|------|
| 로고 | "DrawMate" 텍스트 로고, 클릭 → `/` |
| 탐색 | `/explore` 링크, 활성 시 border-b + primary 색상 |
| 메시지 | `/messages` 링크 |
| 스튜디오 | `/studio` 링크 (인증 시에만 표시) |

### 우측 영역
| 요소 | 설명 |
|------|------|
| 검색 폼 | `input[type=search]`, 제출 시 `/explore?q={query}` 이동 |
| 알림 벨 | 드롭다운으로 최근 20개 알림 표시, 안읽음 뱃지 카운트 |
| 알림 드롭다운 | 알림 목록 + "모두 읽음" 버튼, ScrollArea 내부 |
| 아바타 | 드롭다운: 프로필 보기, 스튜디오, 설정, 로그아웃 |
| 비로그인 | 로그인(`/sign-in`), 시작하기(`/sign-up`) 버튼 |

### 데이터
- Supabase Auth `getUser()` → 인증 상태 확인
- Supabase DB `profiles` → display_name, avatar_path
- GET `/api/v1/notifications?limit=20` → 알림 목록 + unreadCount
- PATCH `/api/v1/notifications/{id}/read` → 개별 읽음
- POST `/api/v1/notifications/read-all` → 전체 읽음

### 인터랙션
- 검색 폼 제출 → `/explore?q=검색어` 라우팅
- 알림 벨 클릭 → 드롭다운 토글
- 알림 읽음 처리 → 낙관적 UI (카운트 즉시 감소)
- 로그아웃 → `supabase.auth.signOut()` + `/` 리다이렉트
- Auth 상태 변경 감지 → `onAuthStateChange` 구독

---

## 2. 탐색 페이지 (Explore)

**파일**: `src/app/(marketing)/explore/page.tsx`
**경로**: `/explore`

### 구조

```
┌──────────────────────────────────────────────────────────┐
│  "Curated Selection"                                      │
│  Discover the Moving Mind                                 │
│  [전체] [일러스트레이션] [UI/UX디자인] [3D모션] [에디토리얼] │
├──────────────────────────────────────────────────────────┤
│  [🔍 검색바 (300ms 디바운스)]              [📱필터] [정렬▼] │
├──────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌───────┐ ┌─────┐                               │
│  │ 3:4 │ │ 1:1   │ │ 4:5 │  ← 비대칭 그리드              │
│  │     │ │       │ │     │                               │
│  └─────┘ └───────┘ └─────┘                               │
│  ┌───────┐ ┌─────┐ ┌─────┐                               │
│  │16:9   │ │ 3:4 │ │ 1:1 │                               │
│  └───────┘ └─────┘ └─────┘                               │
│  (무한 스크롤 — IntersectionObserver, 200px 전 트리거)     │
└──────────────────────────────────────────────────────────┘
```

### 컴포넌트 구성

**SearchBar** (`components/search/search-bar.tsx`)
- 디바운스 300ms, `setQ()` 호출
- X 버튼으로 검색어 클리어

**FilterPanel** (`components/search/filter-panel.tsx`)
- GET `/api/v1/tags` → 태그 목록 (staleTime 5분)
- 4개 카테고리: field / skill / tool / style
- 체크박스 UI, `toggleTag(category, slug)` 호출
- 모바일: Sheet(시트) 내부에 표시

**PortfolioGrid** (`components/search/portfolio-grid.tsx`)
- 무한 쿼리: `/api/v1/portfolios?q={q}&sort={sort}&fieldTags[]={tags}...`
- IntersectionObserver (200px 전 로드)
- 비대칭 그리드: 3:4, 1:1, 4:5, 16:9 비율 혼합
- 빈 상태: "필터를 초기화하거나 포트폴리오를 등록해보세요"

**SortDropdown** (`components/search/sort-dropdown.tsx`)
- 옵션: 최신순(latest) / 인기순(popular) / 가격↑(price_asc) / 가격↓(price_desc)

### 상태 관리

**Zustand Store** (`store/explore-store.ts`)
```
상태: q, sort, filters { fieldTags[], skillTags[], toolTags[], styleTags[] }
액션: setQ, setSort, setFilters, toggleTag, clearFilters, reset
동기화: URL 파라미터 ↔ Store 양방향
```

### 인터랙션
- 필터 필 클릭 → 해당 fieldTag로 필터 설정 (또는 전체 리셋)
- 검색어 입력 → 300ms 후 스토어 업데이트 → URL 반영 → 그리드 리페치
- 정렬 변경 → 그리드 리페치
- 카드 클릭 → `/portfolio/{slug}`
- 무한 스크롤 → 다음 페이지 자동 로드

---

## 3. 메시지 페이지 (Messages)

### 3-1. 대화 목록 `/messages`

**파일**: `src/app/(app)/messages/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌────────────────────────────┐    │
│  │ 메시지             │  │                            │    │
│  │ [🔍 대화 검색]     │  │     💬                     │    │
│  │ ┌──────────────┐ │  │                            │    │
│  │ │ ● 김작가       │ │  │  "대화를 선택하세요"        │    │
│  │ │ 안녕하세요...   │ │  │                            │    │
│  │ │ 2분 전  (2)    │ │  │  작가의 포트폴리오에서      │    │
│  │ └──────────────┘ │  │  연락하기를 눌러 대화를      │    │
│  │ ┌──────────────┐ │  │  시작하세요.                 │    │
│  │ │ 이디자이너     │ │  │                            │    │
│  │ │ 감사합니다!    │ │  │  [포트폴리오 탐색]          │    │
│  │ └──────────────┘ │  │                            │    │
│  └──────────────────┘  └────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
* 모바일: 좌측 대화 목록만 전체 폭
* 데스크톱: 좌측 w-80~96, 우측 빈 상태
```

**ConversationList** (`components/messaging/conversation-list.tsx`)
- GET `/api/v1/conversations?limit=50`
- 검색 입력: otherUser.name으로 클라이언트 필터링
- 리스트 아이템: 아바타 + 이름 + 마지막 메시지 + 시간 + 안읽음 뱃지
- 온라인 인디케이터: 초록 점 (애니메이션 펄스)
- 활성 대화 하이라이트

### 3-2. 대화 상세 `/messages/[conversationId]`

**파일**: `src/app/(app)/messages/[conversationId]/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────────┐    │
│ │ 대화 목록 │ │ ← (모바일) ● 김작가 · 온라인          │    │
│ │ (사이드바)│ ├──────────────────────────────────────┤    │
│ │          │ │ [이전 메시지 더 보기]                  │    │
│ │          │ │                                      │    │
│ │          │ │ ┌──────────┐                         │    │
│ │          │ │ │ 상대 메시지│                         │    │
│ │          │ │ └──────────┘                         │    │
│ │          │ │              ┌──────────────┐        │    │
│ │          │ │              │ 내 메시지 (파랑)│        │    │
│ │          │ │              └──────────────┘        │    │
│ │          │ │              ┌──────────────┐        │    │
│ │          │ │              │ 전송 중... (흐림)│       │    │
│ │          │ │              └──────────────┘        │    │
│ │          │ ├──────────────────────────────────────┤    │
│ │          │ │ [메시지 입력]          [📎] [전송▶]   │    │
│ └──────────┘ └──────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**MessageBubble** (`components/messaging/message-bubble.tsx`)
- 내 메시지: 우측 정렬, primary 색상
- 상대 메시지: 좌측 정렬, card 색상
- 이미지: 240x180, 라운드 코너
- 타임스탬프: 한국어 상대 시간 (formatDistanceToNow)

**MessageInput** (`components/messaging/message-input.tsx`)
- 텍스트 영역: 자동 리사이즈, Enter 전송 / Shift+Enter 줄바꿈
- 파일 첨부: 이미지 선택 + 미리보기
- 전송: FormData (파일 포함) 또는 JSON (텍스트만)
- 한국어 IME: compositionstart/end 이벤트 처리
- 낙관적 UI: 전송 즉시 화면에 표시

### 데이터
- 무한 쿼리: `/api/v1/conversations/{id}/messages?cursor={cursor}`
- 실시간: Supabase Realtime `messages` 테이블 INSERT 구독
- 폴백: 2초 폴링 (Realtime 실패 시)
- 메시지 전송: POST `/api/v1/conversations/{id}/messages`

### 인터랙션
- 메시지 전송 → 낙관적 UI → 서버 확인 → 롤백 or 확정
- 이전 메시지 로드 → 커서 기반 역순 페이지네이션
- 새 메시지 수신 → 자동 스크롤 → 안읽음 카운트 갱신
- 이미지 첨부 → 미리보기 → 전송
- 403 에러 → "접근 권한이 없는 대화입니다"

---

## 4. 포트폴리오 생성/편집 페이지

### 4-1. 생성 `/studio/portfolios/new`

**파일**: `src/app/(app)/studio/portfolios/new/page.tsx`

```
┌─────────────────────────────┐
│  ⏳ 포트폴리오를 준비하는 중...│
│  (자동으로 초안 생성 후       │
│   편집 페이지로 리다이렉트)    │
└─────────────────────────────┘
```

- POST `/api/v1/portfolios` → 빈 초안 생성
- 중복 방지: Promise 캐싱
- 성공 → `/studio/portfolios/{id}/edit` 리다이렉트
- 실패 → 에러 메시지 + `/studio` 링크

### 4-2. 편집 `/studio/portfolios/[portfolioId]/edit`

**파일**: `src/app/(app)/studio/portfolios/[portfolioId]/edit/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│ ← 목록  "포트폴리오 편집"                     [미리보기▶] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                 EditorWizard                        │  │
│  │                                                    │  │
│  │  ── 스텝 헤더 ──────────────────────────────────   │  │
│  │  [1.레이아웃] → [2.업로드] → [3.정보] → [4.태그]   │  │
│  │  ══════════════════════════ 진행 바                 │  │
│  │                                                    │  │
│  │  ── 스텝별 콘텐츠 ─────────────────────────────   │  │
│  │                                                    │  │
│  │  Step 1: TemplateSelector                         │  │
│  │    → 시드된 템플릿 카드 그리드 선택                  │  │
│  │                                                    │  │
│  │  Step 2: ImageUploader                            │  │
│  │    → 드래그앤드롭 업로드, 리오더, 커버 지정          │  │
│  │    → 캡션 입력, 삭제                               │  │
│  │                                                    │  │
│  │  Step 3: InfoForm                                 │  │
│  │    → 제목 (2-80자, 필수)                           │  │
│  │    → 요약 (10-300자)                               │  │
│  │    → 설명 (자유 텍스트)                             │  │
│  │    → 시작 가격 (원, 선택)                          │  │
│  │    → 작업 기간 (1-365일, 선택)                     │  │
│  │                                                    │  │
│  │  Step 4: TagSelector                              │  │
│  │    → field / skill / tool / style 4카테고리        │  │
│  │    → 최대 23개 선택                                │  │
│  │                                                    │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ [나가기]  [임시저장]        [← 이전] [다음 →/발행] │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**EditorWizard** (`components/portfolio-editor/editor-wizard.tsx`)

### 4단계 위저드

| 스텝 | 컴포넌트 | 아이콘 | 진행 조건 |
|------|---------|--------|----------|
| 1. 레이아웃 | TemplateSelector | Layout | 템플릿 1개 선택 |
| 2. 업로드 | ImageUploader | Upload | 이미지 1개 이상 |
| 3. 정보 | InfoForm | Info | 제목 비어있지 않음 |
| 4. 태그 | TagSelector | Tag | 항상 진행 가능 |

### 데이터 관리
- Zustand `editor-store`: currentStep, portfolioId, images, tags, formData, isDirty
- 자동저장: isDirty 상태에서 3초 후 자동 PATCH
- 수동 저장: "임시저장" 버튼
- 발행: 마지막 스텝에서 POST `/api/v1/portfolios/{id}/publish`

### 저장 상태 표시
- 💾 저장됨 / ⏳ 저장 중... / 헤더에 실시간 표시

### API
- PATCH `/api/v1/portfolios/{id}` → 초안 저장 (자동/수동)
- POST `/api/v1/portfolios/{id}/publish` → 발행
- GET `/api/v1/portfolios/{id}` → 편집 페이지 진입 시 기존 데이터 로드

### 인터랙션
- 다음 → 스텝 진행 조건 확인 → 자동저장 → 다음 스텝
- 이전 → 자동저장 → 이전 스텝
- 나가기 → 임시저장 → `/studio/portfolios` 이동
- 발행 → 최종 저장 + 발행 API → 성공 토스트 → 목록 이동

---

## 5. 알림 (Notifications)

### 5-1. 헤더 드롭다운 알림

**위치**: Header 컴포넌트 내부 DropdownMenu

```
┌────────────────────────────┐
│ 알림              [모두 읽음]│
├────────────────────────────┤
│ 💬 김작가님이 메시지를 보냈습니다 │
│    2분 전            ● 안읽음│
│                    [읽음 처리]│
├────────────────────────────┤
│ ❤ 누군가 포트폴리오를 저장했습니다│
│    1시간 전                  │
├────────────────────────────┤
│ (ScrollArea, max-h-80)      │
│ (빈 상태: 🔔 알림이 없습니다) │
└────────────────────────────┘
```

### 5-2. 알림 페이지 `/notifications`

**파일**: `src/app/(app)/notifications/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│ 알림                                       [모두 읽음]    │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐   │
│ │ 💬 새 메시지: 김작가님이 메시지를 보냈습니다          │   │
│ │    2분 전                               ● [읽음처리] │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ ❤ 북마크: 누군가 내 포트폴리오를 저장했습니다         │   │
│ │    1시간 전                                        │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ 🔔 시스템: 프로필 업데이트 안내                      │   │
│ │    어제                                            │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ (빈 상태: 🔔 알림이 없습니다)                             │
└──────────────────────────────────────────────────────────┘
```

**NotificationItem** (`components/notifications/notification-item.tsx`)

| 타입 | 아이콘 | 색상 |
|------|--------|------|
| message_received | MessageSquare | blue-500 |
| message_replied | MessageSquare | indigo-500 |
| bookmark_added | Heart | red-500 |
| system_notice | Bell | muted |

### 데이터
- GET `/api/v1/notifications` → items[], unreadCount
- PATCH `/api/v1/notifications/{id}/read` → 개별 읽음
- POST `/api/v1/notifications/read-all` → 전체 읽음

### 인터랙션
- 안읽은 알림: 파란 배경 + 파란 점 인디케이터
- "읽음 처리" 버튼: 개별 읽음 (안읽은 항목에만 표시)
- "모두 읽음" 버튼: 전체 읽음 (안읽은 항목이 있을 때만 표시)
- React Query `invalidateQueries` 호출로 목록 리프레시

---

## 6. 사용자 프로필 상세 페이지

**파일**: `src/app/(marketing)/users/[userId]/page.tsx`
**경로**: `/users/[userId]`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────┐                                                │
│  │ 🖼   │  작가 이름 (3xl, bold)                          │
│  │아바타 │  "디지털 아키텍트" (헤드라인)                    │
│  │48x48 │  ● 활동 가능  │  📁 포트폴리오 5개              │
│  └──────┘                                                │
│                                                          │
│  바이오 텍스트가 여기에 표시됩니다. 작가의 소개글을          │
│  보여주는 영역입니다.                                      │
│                                                          │
│  [공유] [링크] [포트폴리오]                                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Featured Project                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [히어로 이미지 — 그라디언트 오버레이]                 │  │
│  │                                                    │  │
│  │  포트폴리오 제목                                    │  │
│  │  요약 설명 텍스트                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [포트폴리오]  [컬렉션]  [소개]                            │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│  │PortCard │ │PortCard │ │PortCard │                    │
│  │         │ │         │ │         │                    │
│  └─────────┘ └─────────┘ └─────────┘                    │
│                                                          │
│  (빈 상태: "아직 공개된 포트폴리오가 없습니다")             │
└──────────────────────────────────────────────────────────┘
```

### 데이터 (서버사이드)
- Supabase: `profiles` 테이블 (display_name, avatar_path, headline, bio, availability_status, is_profile_public)
- Supabase: `portfolios` + `portfolio_images` JOIN (status=published, deleted_at=null)
- 이미지 URL: `profile-avatars`, `portfolio-public` 버킷에서 생성
- OG 메타데이터: 동적 generateMetadata (제목, 설명, 이미지)

### 가용 상태 뱃지
| 값 | 라벨 | 스타일 |
|---|------|--------|
| open | 활동 가능 | default (초록) |
| busy | 바쁨 | secondary (황색) |
| unavailable | 활동 불가 | destructive (빨강) |

### 인터랙션
- Featured 프로젝트 클릭 → `/portfolio/{slug}`
- 포트폴리오 그리드 카드 클릭 → `/portfolio/{slug}`
- 공유/링크 버튼 (현재 비기능)
- 탭 전환: 포트폴리오/컬렉션/소개 (현재 포트폴리오 탭만 활성)

---

## 7. 포트폴리오 상세 페이지

**파일**: `src/app/(marketing)/portfolio/[portfolioSlug]/page.tsx`
**경로**: `/portfolio/[slug]`

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │ "Featured Project"       │  │ OwnerCard            │  │
│  │ 포트폴리오 제목 (4xl)     │  │ ┌──┐                 │  │
│  │                          │  │ │🖼│ 작가 이름        │  │
│  │ ┌──────────────────────┐ │  │ └──┘ 헤드라인         │  │
│  │ │ 히어로 이미지          │ │  │ [연락하기]           │  │
│  │ │ (16:10 비율)          │ │  ├──────────────────────┤  │
│  │ └──────────────────────┘ │  │ 💰 시작가   ⏱ 기간   │  │
│  │ ┌──────┐ ┌──────┐       │  │ 50,000원    14일      │  │
│  │ │서브1  │ │서브2  │       │  │ (null→"협의")         │  │
│  │ └──────┘ └──────┘       │  ├──────────────────────┤  │
│  │ ┌──────────────────────┐ │  │ [연락하기] (풀와이드)  │  │
│  │ │ 나머지 이미지 (파노라마)│ │  │ [❤ 북마크 12]        │  │
│  │ └──────────────────────┘ │  └──────────────────────┘  │
│  │                          │                            │
│  │ ── 설명 ──               │                            │
│  │ 포트폴리오 본문 텍스트    │                            │
│  │                          │                            │
│  │ ── 태그 ──               │                            │
│  │ [일러스트] [캐릭터] [판타지]│                           │
│  └──────────────────────────┘                            │
└──────────────────────────────────────────────────────────┘
* 소유자 접근 시: 연락하기 대신 [편집] 버튼
* 사이드바: 스크롤 시 sticky
```

### 컴포넌트

**PortfolioGallery** (`components/portfolio/portfolio-gallery.tsx`)
- 히어로: 풀와이드 16:10, 호버 줌
- 서브 2장: 그리드 (translate-y 오프셋 ±4px)
- 나머지: 16:6 파노라마 스트립

**OwnerCard** (`components/portfolio/owner-card.tsx`)
- 그라디언트 링 아바타 (primary → tertiary)
- 이름 (xl, bold, 호버 밑줄), 헤드라인 (sm, uppercase)
- 클릭 → `/users/{userId}`

**ContactCta** (`components/portfolio/contact-cta.tsx`)
- 소유자: "내 포트폴리오" (disabled) + 안내 텍스트
- 비소유자: "메시지로 문의하기" + MessageSquare 아이콘
- POST `/api/v1/conversations/direct` → conversationId 반환 → `/messages/{id}` 이동
- 401 → `/sign-in` 리다이렉트

**BookmarkButton** (`components/portfolio/bookmark-button.tsx`)
- 낙관적 UI: 즉시 상태+카운트 변경
- POST (북마크) / DELETE (해제) `/api/v1/portfolios/{id}/bookmark`
- 실패 시 롤백
- 401 → `/sign-in` 리다이렉트
- 북마크 시: 빨간 테두리 + 배경 + 텍스트

**TagChips** (`components/portfolio/tag-chips.tsx`)
| 카테고리 | 색상 |
|---------|------|
| field | secondary-container bg |
| skill | primary/10 bg |
| tool | tertiary/10 bg |
| style | muted bg |

### 데이터 (서버사이드)
- Supabase: `portfolios` + `portfolio_images` + `portfolio_tags(tags)` + `profiles` JOIN
- 필터: status=published, visibility=public, deleted_at=null, slug 매칭
- 북마크 체크: 인증 시 현재 유저의 북마크 여부 확인
- 이미지 URL: display_path > original_path > thumb_path 우선순위
- OG 메타데이터: 동적 generateMetadata

### 인터랙션
- 갤러리 이미지 확인
- 작가 카드 클릭 → `/users/{userId}`
- 연락하기 → 대화 생성 → `/messages/{conversationId}`
- 북마크 토글 → 낙관적 UI
- 태그 칩: 표시만 (클릭 불가)

---

## 화면 간 네비게이션 요약

```
헤더 → /explore (탐색)
    → /messages (메시지)
    → /studio (스튜디오)
    → /users/{id} (프로필)
    → /settings (설정)

/explore → /portfolio/{slug} (카드 클릭)

/portfolio/{slug} → /users/{userId} (작가 카드)
                  → /messages/{id} (연락하기)

/users/{userId} → /portfolio/{slug} (포트폴리오 클릭)

/messages → /messages/{id} (대화 선택)
         → /explore (빈 상태 CTA)

/studio/portfolios/new → /studio/portfolios/{id}/edit (자동)
/studio/portfolios/{id}/edit → /portfolio/{slug} (미리보기)
                              → /studio/portfolios (나가기)
```
