# DrawMate — API 명세서

버전: Draft v0.1  
작성일: 2026-03-21  
기반 문서: `DrawMate_Project_Guide.docx` 3.6 API 명세서, ERD v0.1, 기능 명세서 v0.1

---

## 0. 기술 기준 버전

| 항목 | 권장 버전 / 기준 |
|---|---|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| TypeScript | 5.9.3 |
| Supabase JS SDK | `@supabase/supabase-js` 2.99.3 |
| Supabase SSR Helper | `@supabase/ssr` 0.9.0 |
| API 구현 방식 | Next.js App Router 기준 `Route Handlers + Server Functions` |
| 인증 백엔드 | Supabase Auth (JWT + Cookie session) |

### 해석 원칙
- 신규 App Router 프로젝트에서는 `pages/api` 기반 API Routes 보다 **`app/api/**/route.ts` Route Handlers** 를 기본값으로 둔다.
- 내부 mutation 은 가능한 경우 **Server Functions(Server Actions 포함)** 으로 수행하되, 외부 클라이언트/모바일/Swagger 협업이 필요한 엔드포인트는 **REST Route Handlers** 로 노출한다.
- Supabase Auth Helpers 구패키지 대신 **`@supabase/ssr`** 를 사용한다.

---

## 1. API 설계 원칙

### 1.1 스타일
- Base Path: `/api/v1`
- 리소스 중심 plural naming 사용
  - 예: `/portfolios`, `/conversations`, `/notifications`
- JSON payload 는 **camelCase**
- DB schema 는 **snake_case**
- 서버 boundary 에서 camelCase ↔ snake_case 변환

### 1.2 RESTful 컨벤션
- `GET` 조회
- `POST` 생성/행위 트리거
- `PATCH` 부분 수정
- `DELETE` 제거
- 검색은 별도 `/search` 대신 `GET /portfolios` query parameter 로 통합
- 단, 의미상 command 성격이 강한 액션은 하위 command path 허용
  - 예: `POST /portfolios/{portfolioId}/publish`

### 1.3 버저닝
- Major breaking change 발생 시 `/api/v2`
- Minor 추가는 동일 버전 내부에 optional field / optional endpoint 방식으로 확장
- Deprecated endpoint 는 최소 1개 minor cycle 동안 병행 운영

### 1.4 공통 응답 포맷

```ts
export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "FILE_TYPE_NOT_ALLOWED"
  | "FILE_TOO_LARGE"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_ERROR"

export interface ApiSuccess<T> {
  data: T
  meta?: Record<string, unknown>
  requestId: string
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, unknown>
    fieldErrors?: Record<string, string[]>
  }
  requestId: string
}

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}
```

### 1.5 상태 코드 체계

| 상태 코드 | 의미 |
|---|---|
| `200 OK` | 조회/수정 성공 |
| `201 Created` | 생성 성공 |
| `204 No Content` | 삭제/토글 해제 성공 |
| `400 Bad Request` | 잘못된 파라미터/요청 형식 |
| `401 Unauthorized` | 인증 정보 없음/만료 |
| `403 Forbidden` | 인증은 되었으나 권한 없음 |
| `404 Not Found` | 리소스 없음 또는 비공개 |
| `409 Conflict` | 중복 리소스, 상태 충돌 |
| `413 Payload Too Large` | 파일 용량 초과 |
| `415 Unsupported Media Type` | 파일 형식 불가 |
| `422 Unprocessable Entity` | 도메인 검증 실패 |
| `429 Too Many Requests` | Rate limit 초과 |
| `500 Internal Server Error` | 서버 오류 |

### 1.6 Rate Limit 정책

| Rate Limit Class | 기준 |
|---|---|
| `authStrict` | 10 requests / 10 min / IP |
| `readPublic` | 120 requests / min / IP |
| `readPrivate` | 120 requests / min / user |
| `writeUser` | 60 requests / min / user |
| `messageSend` | 30 requests / min / user + 5 requests / 10 sec / conversation |
| `upload` | 20 requests / 10 min / user |

---

## 2. 인증 / 인가

### 2.1 Supabase Auth 기반 JWT 토큰 플로우

1. 사용자가 이메일/비밀번호 또는 OAuth 로 로그인한다.
2. Supabase Auth 가 세션과 access token(JWT)을 발급한다.
3. Next.js 서버는 `@supabase/ssr` 로 쿠키 기반 세션을 읽는다.
4. Route Handler / Server Function 은 사용자 세션을 사용해 Supabase client 를 생성한다.
5. Supabase DB 는 JWT claim + RLS 정책으로 row access 를 판단한다.
6. 서비스 역할(service role key)은 브라우저에 절대 노출하지 않고, Edge Function / 안전한 서버 환경에서만 사용한다.

### 2.2 인증 전달 방식
- **브라우저 → Next.js**: httpOnly cookie session (권장)
- **외부 REST 호출 / 테스트 도구**: `Authorization: Bearer <access_token>`
- **서버 → Supabase**: 사용자 세션 기반 client 또는 서버 전용 service role client

### 2.3 인가(Authorization) 원칙
- UI 차단과 무관하게 **모든 쓰기 요청은 서버에서 소유권 검증**
- 실제 row 권한은 Supabase RLS 가 최종 방어선
- 메시지/북마크/알림은 `auth.uid()` 와 FK 를 기준으로 제어
- 공개 포트폴리오 조회는 anon role 에도 허용 가능하되, draft/private 은 owner only

---

## 3. 엔드포인트 요약

| 메서드 | URL | 설명 | 인증 | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/sign-up` | 이메일 회원가입 | 선택(비로그인) | `authStrict` |
| `POST` | `/api/v1/auth/sign-in` | 이메일 로그인 | 선택(비로그인) | `authStrict` |
| `POST` | `/api/v1/auth/sign-out` | 로그아웃 | 필요 | `writeUser` |
| `GET` | `/api/v1/me` | 현재 사용자/세션 요약 | 필요 | `readPrivate` |
| `PATCH` | `/api/v1/me/profile` | 내 프로필 수정 | 필요 | `writeUser` |
| `GET` | `/api/v1/users/{userId}` | 공개 프로필 조회 | 선택 | `readPublic` |
| `GET` | `/api/v1/tags` | 태그 목록 | 선택 | `readPublic` |
| `GET` | `/api/v1/templates` | 템플릿 목록 | 선택 | `readPublic` |
| `GET` | `/api/v1/portfolios` | 포트폴리오 목록/검색/필터/정렬 | 선택 | `readPublic` |
| `POST` | `/api/v1/portfolios` | 포트폴리오 생성 | 필요 | `writeUser` |
| `GET` | `/api/v1/portfolios/{portfolioId}` | 포트폴리오 상세 | 선택 | `readPublic` |
| `PATCH` | `/api/v1/portfolios/{portfolioId}` | 포트폴리오 수정 | 필요 | `writeUser` |
| `DELETE` | `/api/v1/portfolios/{portfolioId}` | 포트폴리오 삭제/보관 | 필요 | `writeUser` |
| `POST` | `/api/v1/portfolios/{portfolioId}/publish` | 발행 전환 | 필요 | `writeUser` |
| `POST` | `/api/v1/portfolios/{portfolioId}/images` | 포트폴리오 이미지 업로드 | 필요 | `upload` |
| `PATCH` | `/api/v1/portfolios/{portfolioId}/images/reorder` | 이미지 순서 변경 | 필요 | `writeUser` |
| `DELETE` | `/api/v1/portfolios/{portfolioId}/images/{imageId}` | 이미지 삭제 | 필요 | `writeUser` |
| `POST` | `/api/v1/portfolios/{portfolioId}/bookmark` | 북마크 추가 | 필요 | `writeUser` |
| `DELETE` | `/api/v1/portfolios/{portfolioId}/bookmark` | 북마크 해제 | 필요 | `writeUser` |
| `GET` | `/api/v1/bookmarks` | 내 북마크 목록 | 필요 | `readPrivate` |
| `POST` | `/api/v1/conversations/direct` | direct 대화 생성/재사용 | 필요 | `writeUser` |
| `GET` | `/api/v1/conversations` | 내 대화방 목록 | 필요 | `readPrivate` |
| `GET` | `/api/v1/conversations/{conversationId}/messages` | 메시지 목록 | 필요 | `readPrivate` |
| `POST` | `/api/v1/conversations/{conversationId}/messages` | 메시지 전송 | 필요 | `messageSend` |
| `POST` | `/api/v1/messages/attachments` | 메시지 첨부 업로드 | 필요 | `upload` |
| `GET` | `/api/v1/notifications` | 알림 목록 | 필요 | `readPrivate` |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | 단건 읽음 처리 | 필요 | `writeUser` |
| `POST` | `/api/v1/notifications/read-all` | 전체 읽음 처리 | 필요 | `writeUser` |

---

## 4. 엔드포인트 상세 명세

> 실패 응답은 특별한 언급이 없는 한 공통 `ApiErrorResponse` 를 사용한다.

### 4.1 `POST /api/v1/auth/sign-up`

**설명**: 이메일 회원가입  
**인증 필요 여부**: 아니오  
**Rate Limit**: `authStrict`

#### Request Headers
| 헤더 | 필수 | 값 |
|---|---|---|
| `Content-Type` | Y | `application/json` |

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["email", "password"],
  "properties": {
    "email": { "type": "string", "format": "email", "maxLength": 255 },
    "password": { "type": "string", "minLength": 8, "maxLength": 72 },
    "displayName": { "type": "string", "minLength": 2, "maxLength": 40 },
    "role": { "type": "string", "enum": ["assistant", "recruiter"] }
  },
  "additionalProperties": false
}
```

#### Success Response Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["data", "requestId"],
  "properties": {
    "data": {
      "type": "object",
      "required": ["userId", "email", "emailVerificationRequired"],
      "properties": {
        "userId": { "type": "string", "format": "uuid" },
        "email": { "type": "string", "format": "email" },
        "emailVerificationRequired": { "type": "boolean" },
        "nextStep": { "type": "string", "enum": ["verify_email", "complete_onboarding"] }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `201`: 회원가입 성공
- `400`: 이메일/비밀번호 형식 오류
- `409`: 이미 가입된 이메일
- `429`: 시도 횟수 초과

---

### 4.2 `POST /api/v1/auth/sign-in`

**설명**: 이메일 로그인  
**인증 필요 여부**: 아니오  
**Rate Limit**: `authStrict`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["email", "password"],
  "properties": {
    "email": { "type": "string", "format": "email" },
    "password": { "type": "string", "minLength": 8, "maxLength": 72 }
  },
  "additionalProperties": false
}
```

#### Success Response Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["data", "requestId"],
  "properties": {
    "data": {
      "type": "object",
      "required": ["userId", "session"],
      "properties": {
        "userId": { "type": "string", "format": "uuid" },
        "session": {
          "type": "object",
          "required": ["accessToken", "expiresAt"],
          "properties": {
            "accessToken": { "type": "string" },
            "refreshToken": { "type": "string" },
            "expiresAt": { "type": "string", "format": "date-time" }
          }
        },
        "onboardingRequired": { "type": "boolean" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 로그인 성공
- `401`: 이메일/비밀번호 불일치
- `429`: 로그인 시도 제한

---

### 4.3 `GET /api/v1/me`

**설명**: 현재 세션 사용자 요약  
**인증 필요 여부**: 예  
**Rate Limit**: `readPrivate`

#### Request Headers
| 헤더 | 필수 | 값 |
|---|---|---|
| `Authorization` | 조건부 | `Bearer <JWT>` |
| `Cookie` | 조건부 | SSR session cookie |

#### Success Response Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["data", "requestId"],
  "properties": {
    "data": {
      "type": "object",
      "required": ["userId", "profile"],
      "properties": {
        "userId": { "type": "string", "format": "uuid" },
        "profile": {
          "type": "object",
          "properties": {
            "role": { "type": ["string", "null"], "enum": ["assistant", "recruiter", null] },
            "displayName": { "type": ["string", "null"] },
            "avatarUrl": { "type": ["string", "null"], "format": "uri" },
            "availabilityStatus": { "type": "string", "enum": ["open", "busy", "unavailable"] }
          }
        },
        "counts": {
          "type": "object",
          "properties": {
            "portfolios": { "type": "integer" },
            "unreadNotifications": { "type": "integer" },
            "unreadConversations": { "type": "integer" }
          }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 성공
- `401`: 세션 없음/만료

---

### 4.4 `PATCH /api/v1/me/profile`

**설명**: 내 프로필 수정  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "properties": {
    "displayName": { "type": "string", "minLength": 2, "maxLength": 40 },
    "headline": { "type": "string", "maxLength": 80 },
    "bio": { "type": "string", "maxLength": 500 },
    "avatarPath": { "type": ["string", "null"] },
    "snsLinks": {
      "type": "array",
      "maxItems": 5,
      "items": { "type": "string", "format": "uri" }
    },
    "availabilityStatus": { "type": "string", "enum": ["open", "busy", "unavailable"] },
    "availableHours": { "type": "object" },
    "isProfilePublic": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["profile"],
      "properties": {
        "profile": { "type": "object" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 수정 성공
- `400`: URL/형식 오류
- `401`: 인증 필요
- `422`: 비즈니스 규칙 위반

---

### 4.5 `GET /api/v1/users/{userId}`

**설명**: 공개 프로필 조회  
**인증 필요 여부**: 아니오(비공개면 owner only)  
**Rate Limit**: `readPublic`

#### Path Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `userId` | `uuid` | Y | 조회할 사용자 ID |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["profile", "portfolios"],
      "properties": {
        "profile": { "type": "object" },
        "portfolios": {
          "type": "array",
          "items": { "type": "object" }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 공개 프로필 조회 성공
- `403`: 비공개 프로필
- `404`: 사용자 없음

---

### 4.6 `GET /api/v1/tags`

**설명**: 태그 목록 조회  
**인증 필요 여부**: 아니오  
**Rate Limit**: `readPublic`

#### Query Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `category` | `string` | N | `field|skill|tool|style` |
| `activeOnly` | `boolean` | N | 기본 `true` |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "slug", "name", "category"],
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "slug": { "type": "string" },
          "name": { "type": "string" },
          "category": { "type": "string" }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

### 4.7 `GET /api/v1/templates`

**설명**: 템플릿 목록 조회  
**인증 필요 여부**: 아니오  
**Rate Limit**: `readPublic`

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "code", "name", "isActive"],
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "code": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": ["string", "null"] },
          "previewImageUrl": { "type": ["string", "null"], "format": "uri" },
          "isActive": { "type": "boolean" }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

### 4.8 `GET /api/v1/portfolios`

**설명**: 포트폴리오 목록 / 검색 / 필터 / 정렬  
**인증 필요 여부**: 아니오  
**Rate Limit**: `readPublic`

#### Query Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `q` | `string` | N | 검색어 1~50자 |
| `fieldTags[]` | `string[]` | N | field slug 목록 |
| `skillTags[]` | `string[]` | N | skill slug 목록 |
| `toolTags[]` | `string[]` | N | tool slug 목록 |
| `styleTags[]` | `string[]` | N | style slug 목록 |
| `sort` | `string` | N | `latest|popular|price_asc|price_desc` |
| `cursor` | `string` | N | cursor-based pagination token |
| `limit` | `integer` | N | 기본 24, 최대 48 |

#### Success Response Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["data", "requestId"],
  "properties": {
    "data": {
      "type": "object",
      "required": ["items", "nextCursor", "hasMore"],
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "slug", "title", "summary", "thumbnailUrl", "owner", "tags"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "slug": { "type": "string" },
              "title": { "type": "string" },
              "summary": { "type": "string" },
              "thumbnailUrl": { "type": ["string", "null"], "format": "uri" },
              "startingPriceKrw": { "type": ["integer", "null"] },
              "publishedAt": { "type": "string", "format": "date-time" },
              "owner": {
                "type": "object",
                "properties": {
                  "id": { "type": "string", "format": "uuid" },
                  "displayName": { "type": ["string", "null"] },
                  "avatarUrl": { "type": ["string", "null"], "format": "uri" }
                }
              },
              "tags": {
                "type": "array",
                "items": { "type": "object" }
              }
            }
          }
        },
        "nextCursor": { "type": ["string", "null"] },
        "hasMore": { "type": "boolean" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 성공
- `400`: 잘못된 sort/tag/cursor 값
- `422`: 비즈니스 규칙 위반

---

### 4.9 `POST /api/v1/portfolios`

**설명**: 포트폴리오 생성  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["title", "summary", "templateId"],
  "properties": {
    "title": { "type": "string", "minLength": 2, "maxLength": 80 },
    "summary": { "type": "string", "minLength": 10, "maxLength": 300 },
    "description": { "type": "string", "maxLength": 5000 },
    "templateId": { "type": "string", "format": "uuid" },
    "startingPriceKrw": { "type": ["integer", "null"], "minimum": 0 },
    "durationDays": { "type": ["integer", "null"], "minimum": 1, "maximum": 365 },
    "visibility": { "type": "string", "enum": ["public", "unlisted"] }
  },
  "additionalProperties": false
}
```

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["portfolio"],
      "properties": {
        "portfolio": {
          "type": "object",
          "required": ["id", "slug", "status"],
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "slug": { "type": "string" },
            "status": { "type": "string", "enum": ["draft", "published", "archived"] }
          }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `201`: 생성 성공
- `401`: 인증 필요
- `422`: 필드 길이/값 검증 실패
- `409`: slug 충돌(재생성 후 재시도 가능)

---

### 4.10 `GET /api/v1/portfolios/{portfolioId}`

**설명**: 포트폴리오 상세  
**인증 필요 여부**: 아니오(비공개/draft 는 owner only)  
**Rate Limit**: `readPublic`

#### Path Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `portfolioId` | `uuid` 또는 `slug` | Y | 상세 리소스 식별자 |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["portfolio"],
      "properties": {
        "portfolio": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "slug": { "type": "string" },
            "title": { "type": "string" },
            "summary": { "type": "string" },
            "description": { "type": ["string", "null"] },
            "status": { "type": "string" },
            "visibility": { "type": "string" },
            "images": {
              "type": "array",
              "items": { "type": "object" }
            },
            "tags": {
              "type": "array",
              "items": { "type": "object" }
            },
            "owner": { "type": "object" },
            "isBookmarked": { "type": "boolean" }
          }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 성공
- `403`: draft/private 접근 금지
- `404`: 리소스 없음

---

### 4.11 `PATCH /api/v1/portfolios/{portfolioId}`

**설명**: 포트폴리오 수정  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Path Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `portfolioId` | `uuid` | Y | 수정 대상 |

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "minLength": 2, "maxLength": 80 },
    "summary": { "type": "string", "minLength": 10, "maxLength": 300 },
    "description": { "type": "string", "maxLength": 5000 },
    "templateId": { "type": "string", "format": "uuid" },
    "startingPriceKrw": { "type": ["integer", "null"], "minimum": 0 },
    "durationDays": { "type": ["integer", "null"], "minimum": 1, "maximum": 365 },
    "visibility": { "type": "string", "enum": ["public", "unlisted"] },
    "tagIds": {
      "type": "array",
      "maxItems": 23,
      "items": { "type": "string", "format": "uuid" }
    }
  },
  "additionalProperties": false
}
```

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "portfolio": { "type": "object" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 수정 성공
- `401`: 인증 필요
- `403`: 소유권 없음
- `422`: 도메인 검증 실패

---

### 4.12 `DELETE /api/v1/portfolios/{portfolioId}`

**설명**: 포트폴리오 삭제/보관  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### 상태 코드별 의미
- `204`: 성공
- `401`: 인증 필요
- `403`: 소유권 없음
- `404`: 리소스 없음

---

### 4.13 `POST /api/v1/portfolios/{portfolioId}/publish`

**설명**: Draft → Published 전환  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "properties": {
    "visibility": { "type": "string", "enum": ["public", "unlisted"] }
  },
  "additionalProperties": false
}
```

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["portfolioId", "status", "publishedAt"],
      "properties": {
        "portfolioId": { "type": "string", "format": "uuid" },
        "status": { "type": "string", "enum": ["published"] },
        "publishedAt": { "type": "string", "format": "date-time" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 발행 성공
- `403`: 소유권 없음
- `422`: 최소 이미지/필수 태그/프로필 completeness 미충족

---

### 4.14 `POST /api/v1/portfolios/{portfolioId}/images`

**설명**: 포트폴리오 이미지 업로드  
**인증 필요 여부**: 예  
**Rate Limit**: `upload`

#### Request Headers
| 헤더 | 필수 | 값 |
|---|---|---|
| `Content-Type` | Y | `multipart/form-data` |

#### Path Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `portfolioId` | `uuid` | Y | 업로드 대상 포트폴리오 |

#### Multipart Fields
| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `files[]` | File[] | Y | 최대 20개 이미지 |
| `captions[]` | string[] | N | 각 이미지 캡션 |
| `coverIndex` | integer | N | 대표 이미지 인덱스 |

#### 성공 응답 본문
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["images"],
      "properties": {
        "images": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "displayUrl", "thumbUrl", "sortOrder"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "displayUrl": { "type": "string", "format": "uri" },
              "thumbUrl": { "type": "string", "format": "uri" },
              "sortOrder": { "type": "integer" },
              "isCover": { "type": "boolean" }
            }
          }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `201`: 업로드 성공
- `401`: 인증 필요
- `403`: 소유권 없음
- `413`: 파일 용량 초과
- `415`: 이미지 형식 불가
- `422`: 20장 제한 초과 또는 잘못된 coverIndex

---

### 4.15 `PATCH /api/v1/portfolios/{portfolioId}/images/reorder`

**설명**: 이미지 순서 변경 및 cover 지정  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["items"],
  "properties": {
    "items": {
      "type": "array",
      "minItems": 1,
      "maxItems": 20,
      "items": {
        "type": "object",
        "required": ["imageId", "sortOrder"],
        "properties": {
          "imageId": { "type": "string", "format": "uuid" },
          "sortOrder": { "type": "integer", "minimum": 0 },
          "isCover": { "type": "boolean" }
        }
      }
    }
  },
  "additionalProperties": false
}
```

---

### 4.16 `POST /api/v1/portfolios/{portfolioId}/bookmark`

**설명**: 북마크 추가  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["portfolioId", "bookmarked"],
      "properties": {
        "portfolioId": { "type": "string", "format": "uuid" },
        "bookmarked": { "type": "boolean", "const": true }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `201`: 북마크 성공
- `401`: 인증 필요
- `404`: 포트폴리오 없음
- `409`: 이미 저장된 경우(또는 idempotent 200 처리)

---

### 4.17 `DELETE /api/v1/portfolios/{portfolioId}/bookmark`

**설명**: 북마크 해제  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### 상태 코드별 의미
- `204`: 해제 성공
- `401`: 인증 필요

---

### 4.18 `GET /api/v1/bookmarks`

**설명**: 내 북마크 목록  
**인증 필요 여부**: 예  
**Rate Limit**: `readPrivate`

#### Query Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `cursor` | `string` | N | 커서 |
| `limit` | `integer` | N | 기본 24, 최대 48 |

---

### 4.19 `POST /api/v1/conversations/direct`

**설명**: direct 대화 생성 또는 기존 대화 재사용  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "required": ["targetUserId"],
  "properties": {
    "targetUserId": { "type": "string", "format": "uuid" },
    "initialMessage": {
      "type": "object",
      "properties": {
        "body": { "type": "string", "minLength": 1, "maxLength": 2000 },
        "attachmentIds": {
          "type": "array",
          "maxItems": 5,
          "items": { "type": "string", "format": "uuid" }
        }
      }
    },
    "sourcePortfolioId": { "type": ["string", "null"], "format": "uuid" }
  },
  "additionalProperties": false
}
```

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["conversationId", "reused"],
      "properties": {
        "conversationId": { "type": "string", "format": "uuid" },
        "reused": { "type": "boolean" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `201`: 새 대화 생성
- `200`: 기존 대화 재사용
- `401`: 인증 필요
- `409`: 자기 자신과의 대화 시도
- `422`: initialMessage 비어 있음(생성 시 메시지 필수 정책일 때)

---

### 4.20 `GET /api/v1/conversations`

**설명**: 내 대화방 목록  
**인증 필요 여부**: 예  
**Rate Limit**: `readPrivate`

#### Query Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `cursor` | `string` | N | 커서 |
| `limit` | `integer` | N | 기본 20, 최대 50 |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "conversationId": { "type": "string", "format": "uuid" },
              "lastMessageSnippet": { "type": ["string", "null"] },
              "lastMessageAt": { "type": ["string", "null"], "format": "date-time" },
              "unreadCount": { "type": "integer" },
              "peer": { "type": "object" }
            }
          }
        },
        "nextCursor": { "type": ["string", "null"] },
        "hasMore": { "type": "boolean" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

### 4.21 `GET /api/v1/conversations/{conversationId}/messages`

**설명**: 메시지 스레드 조회  
**인증 필요 여부**: 예  
**Rate Limit**: `readPrivate`

#### Path Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `conversationId` | `uuid` | Y | 대화방 ID |

#### Query Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `before` | `string` | N | 이전 메시지 커서 |
| `limit` | `integer` | N | 기본 50, 최대 100 |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "senderId", "messageType", "createdAt"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "senderId": { "type": "string", "format": "uuid" },
              "messageType": { "type": "string", "enum": ["text", "image", "mixed", "system"] },
              "body": { "type": ["string", "null"] },
              "attachments": { "type": "array", "items": { "type": "object" } },
              "createdAt": { "type": "string", "format": "date-time" }
            }
          }
        },
        "nextCursor": { "type": ["string", "null"] },
        "hasMore": { "type": "boolean" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `200`: 조회 성공
- `403`: 참여자가 아님
- `404`: 대화방 없음

---

### 4.22 `POST /api/v1/messages/attachments`

**설명**: 메시지 첨부 선업로드  
**인증 필요 여부**: 예  
**Rate Limit**: `upload`

#### Request Headers
| 헤더 | 필수 | 값 |
|---|---|---|
| `Content-Type` | Y | `multipart/form-data` |

#### Multipart Fields
| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `conversationId` | text | Y | 소속 대화방 |
| `files[]` | File[] | Y | 최대 5개 이미지 |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "attachments": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "storagePath"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "storagePath": { "type": "string" },
              "previewUrl": { "type": ["string", "null"], "format": "uri" }
            }
          }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

### 4.23 `POST /api/v1/conversations/{conversationId}/messages`

**설명**: 메시지 전송  
**인증 필요 여부**: 예  
**Rate Limit**: `messageSend`

#### Request Body (JSON Schema)
```json
{
  "type": "object",
  "properties": {
    "body": { "type": "string", "minLength": 1, "maxLength": 2000 },
    "attachmentIds": {
      "type": "array",
      "maxItems": 5,
      "items": { "type": "string", "format": "uuid" }
    }
  },
  "additionalProperties": false
}
```

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["message"],
      "properties": {
        "message": {
          "type": "object",
          "required": ["id", "conversationId", "senderId", "createdAt"],
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "conversationId": { "type": "string", "format": "uuid" },
            "senderId": { "type": "string", "format": "uuid" },
            "body": { "type": ["string", "null"] },
            "messageType": { "type": "string" },
            "attachments": { "type": "array", "items": { "type": "object" } },
            "createdAt": { "type": "string", "format": "date-time" }
          }
        }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

#### 상태 코드별 의미
- `201`: 전송 성공
- `401`: 인증 필요
- `403`: 참여자가 아님
- `422`: body 와 attachmentIds 모두 비어 있음
- `429`: 채팅 rate limit 초과

---

### 4.24 `GET /api/v1/notifications`

**설명**: 알림 목록 조회  
**인증 필요 여부**: 예  
**Rate Limit**: `readPrivate`

#### Query Parameters
| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `cursor` | `string` | N | 커서 |
| `limit` | `integer` | N | 기본 30, 최대 100 |
| `unreadOnly` | `boolean` | N | 미읽음만 보기 |

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "type", "title", "body", "createdAt"],
            "properties": {
              "id": { "type": "string", "format": "uuid" },
              "type": { "type": "string" },
              "title": { "type": "string" },
              "body": { "type": "string" },
              "entityType": { "type": ["string", "null"] },
              "entityId": { "type": ["string", "null"], "format": "uuid" },
              "readAt": { "type": ["string", "null"], "format": "date-time" },
              "createdAt": { "type": "string", "format": "date-time" }
            }
          }
        },
        "nextCursor": { "type": ["string", "null"] },
        "hasMore": { "type": "boolean" },
        "unreadCount": { "type": "integer" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

### 4.25 `PATCH /api/v1/notifications/{notificationId}/read`

**설명**: 단건 읽음 처리  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["notificationId", "readAt"],
      "properties": {
        "notificationId": { "type": "string", "format": "uuid" },
        "readAt": { "type": "string", "format": "date-time" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

### 4.26 `POST /api/v1/notifications/read-all`

**설명**: 전체 읽음 처리  
**인증 필요 여부**: 예  
**Rate Limit**: `writeUser`

#### Success Response Body
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "required": ["updatedCount"],
      "properties": {
        "updatedCount": { "type": "integer" }
      }
    },
    "requestId": { "type": "string" }
  }
}
```

---

## 5. 파일 업로드 API 설계

### 5.1 처리 방식
- HTTP 입력은 `multipart/form-data`
- 서버는 업로드 즉시 다음을 검사한다.
  - MIME type
  - 실제 파일 시그니처
  - 용량 제한
  - 최대 개수 제한
  - 사용자 소유권
- 업로드 완료 후 DB row 를 생성하고 Storage path 를 반환한다.

### 5.2 포트폴리오 이미지 최적화 전략
- 원본: private bucket (`portfolio-originals`)
- 표시본: public bucket (`portfolio-public`)
- 썸네일: public bucket
- 권장 처리
  - 긴 변 기준 2560px 초과 시 downscale
  - `webp` 우선 생성
  - 썸네일 480~720px
  - EXIF orientation 정규화
  - 메타데이터 최소화
- Next.js `Image` 에서는 public 표시본/썸네일만 사용

### 5.3 채팅 이미지 최적화 전략
- private bucket (`chat-attachments`)
- 긴 변 기준 1600px 내 최적화본 생성
- preview 용 저용량 썸네일 추가 가능
- 원본 보존 여부는 운영 정책으로 선택하되, MVP는 저장 공간 절감을 위해 표시용 단일 최적화본만 유지해도 무방

### 5.4 업로드 방식 선택 기준
- **표준 multipart**: 파일당 6MB 이하, 간단한 웹 UX
- **TUS resumable 업로드**: 6MB 초과, 네트워크 품질이 낮은 환경, 대용량 다중 업로드
- MVP는 Route Handler + multipart 기본 구현으로 시작하고, 대용량 업로드 이슈가 발견되면 Supabase TUS 업로드로 확장

---

## 6. 실시간 기능 설계 (Supabase Realtime)

### 6.1 채널 설계

| 채널 | 범위 | 이벤트 | 권한 |
|---|---|---|---|
| `conversation:{conversationId}` | 대화방 단위 | `message.created`, `message.read`, `typing.started`, `typing.stopped` | 대화 참여자만 |
| `user:{userId}:notifications` | 사용자 단위 | `notification.created`, `notification.read` | 본인만 |
| `conversation:{conversationId}:presence` | 대화방 단위 | presence sync | 대화 참여자만 |

### 6.2 권장 처리 순서
1. DB 에 메시지/알림 row 를 insert 한다.
2. insert 성공 후 private channel 로 broadcast 한다.
3. 클라이언트는 낙관적 UI 상태를 서버 응답/Realtime 이벤트로 reconcile 한다.

### 6.3 설계 원칙
- **DB 가 source of truth**
- **Broadcast 는 전달 수단**
- typing / presence 처럼 휘발성 데이터는 DB 에 저장하지 않는다.
- private channel + Realtime Authorization 을 기본값으로 사용한다.

---

## 7. 페이지네이션 설계 (Cursor-based)

### 7.1 포트폴리오 목록
- 정렬 기준:
  - `latest`: `(publishedAt desc, id desc)`
  - `popular`: `(bookmarkCount desc, id desc)`
  - `price_asc`: `(startingPriceKrw asc nulls last, id desc)`
  - `price_desc`: `(startingPriceKrw desc nulls last, id desc)`
- cursor payload 예시:
```ts
type PortfolioCursor = {
  sort: "latest" | "popular" | "price_asc" | "price_desc"
  value: string | number | null
  id: string
}
```

### 7.2 메시지 목록
- 기준: `(createdAt desc, id desc)`
- 파라미터: `before=<cursor>`
- 최신 메시지는 첫 페이지, 과거 메시지는 cursor 로 추가 로드

### 7.3 커서 인코딩
- 서버가 JSON payload 를 base64url 로 인코딩
- 클라이언트는 opaque string 으로만 취급
- 잘못된 커서는 `400 INVALID_CURSOR`

---

## 8. 주요 엔드포인트 OpenAPI 3.0 / Swagger YAML 예시

```yaml
openapi: 3.0.3
info:
  title: DrawMate API
  version: 1.0.0
servers:
  - url: https://app.drawmate.example/api/v1
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    ApiError:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
              additionalProperties: true
        requestId:
          type: string
    PortfolioCard:
      type: object
      properties:
        id:
          type: string
          format: uuid
        slug:
          type: string
        title:
          type: string
        summary:
          type: string
        thumbnailUrl:
          type: string
          format: uri
          nullable: true
    CursorPagePortfolio:
      type: object
      properties:
        data:
          type: object
          properties:
            items:
              type: array
              items:
                $ref: "#/components/schemas/PortfolioCard"
            nextCursor:
              type: string
              nullable: true
            hasMore:
              type: boolean
        requestId:
          type: string
    CreatePortfolioRequest:
      type: object
      required: [title, summary, templateId]
      properties:
        title:
          type: string
          minLength: 2
          maxLength: 80
        summary:
          type: string
          minLength: 10
          maxLength: 300
        description:
          type: string
        templateId:
          type: string
          format: uuid
        startingPriceKrw:
          type: integer
          minimum: 0
          nullable: true
        durationDays:
          type: integer
          minimum: 1
          maximum: 365
          nullable: true
        visibility:
          type: string
          enum: [public, unlisted]
    DirectConversationRequest:
      type: object
      required: [targetUserId]
      properties:
        targetUserId:
          type: string
          format: uuid
        sourcePortfolioId:
          type: string
          format: uuid
          nullable: true
        initialMessage:
          type: object
          properties:
            body:
              type: string
              minLength: 1
              maxLength: 2000
            attachmentIds:
              type: array
              maxItems: 5
              items:
                type: string
                format: uuid
    SendMessageRequest:
      type: object
      properties:
        body:
          type: string
          minLength: 1
          maxLength: 2000
        attachmentIds:
          type: array
          maxItems: 5
          items:
            type: string
            format: uuid

paths:
  /portfolios:
    get:
      summary: List portfolios with search and filters
      parameters:
        - in: query
          name: q
          schema:
            type: string
        - in: query
          name: sort
          schema:
            type: string
            enum: [latest, popular, price_asc, price_desc]
        - in: query
          name: cursor
          schema:
            type: string
        - in: query
          name: limit
          schema:
            type: integer
            minimum: 1
            maximum: 48
      responses:
        "200":
          description: Portfolio list
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/CursorPagePortfolio"
        "400":
          description: Invalid query
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ApiError"
    post:
      summary: Create portfolio
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreatePortfolioRequest"
      responses:
        "201":
          description: Created
        "401":
          description: Unauthorized
        "422":
          description: Validation failed

  /portfolios/{portfolioId}:
    get:
      summary: Get portfolio detail
      parameters:
        - in: path
          name: portfolioId
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Portfolio detail
        "403":
          description: Private or draft
        "404":
          description: Not found

  /portfolios/{portfolioId}/images:
    post:
      summary: Upload portfolio images
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: portfolioId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [files]
              properties:
                files:
                  type: array
                  items:
                    type: string
                    format: binary
                coverIndex:
                  type: integer
      responses:
        "201":
          description: Upload success
        "413":
          description: File too large
        "415":
          description: Unsupported file type

  /conversations/direct:
    post:
      summary: Create or reuse direct conversation
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/DirectConversationRequest"
      responses:
        "200":
          description: Reused existing conversation
        "201":
          description: Created new conversation
        "409":
          description: Conflict

  /conversations/{conversationId}/messages:
    post:
      summary: Send a message
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: conversationId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SendMessageRequest"
      responses:
        "201":
          description: Message sent
        "403":
          description: Not a participant
        "429":
          description: Rate limited
```

---

## 9. 구현 권장안: Route Handlers vs Server Functions

| 용도 | 권장 구현 | 이유 |
|---|---|---|
| 공개 조회 API | Route Handlers | 캐시 제어, OpenAPI 문서화, 외부 호출 용이 |
| 인증 필요 조회 API | Route Handlers 또는 Server Function | 페이지/클라이언트 재사용성 고려 |
| 폼 기반 mutation | Server Function 우선 | App Router 와 폼 UX 친화적 |
| 외부 클라이언트 재사용이 필요한 mutation | Route Handlers | 모바일/Swagger/Postman 대응 |
| 파일 업로드 | Route Handlers | multipart 처리 및 Storage 연동 명확 |
| 웹훅/배치/3rd party secret | Edge Functions | 비밀키/장기 처리/서드파티 호출 적합 |

---

## 10. 참고 자료

- https://nextjs.org/docs/app/getting-started/route-handlers
- https://nextjs.org/docs/app/getting-started/mutating-data
- https://nextjs.org/docs/app/guides/forms
- https://supabase.com/docs/guides/auth/quickstarts/nextjs
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/storage/uploads/standard-uploads
- https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- https://supabase.com/docs/guides/storage/serving/image-transformations
- https://supabase.com/docs/guides/storage/production/scaling
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://www.npmjs.com/package/@supabase/supabase-js
- https://www.npmjs.com/package/@supabase/ssr
- https://www.npmjs.com/package/next
- 내부 기준 문서: `DrawMate_Project_Guide.docx`
