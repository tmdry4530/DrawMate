-- ============================================================
-- 00009_storage_portfolio_buckets.sql
-- Storage buckets and policies for portfolio assets
--
-- Path conventions:
--   portfolio-originals : {user_id}/{portfolio_id}/{filename}
--   portfolio-public    : {user_id}/{portfolio_id}/{filename}
--   system-template-assets : {template_code}/{filename}
-- ============================================================

-- ── 1. Buckets ───────────────────────────────────────────────

-- 원본 이미지 (private): 소유자만 접근
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-originals',
  'portfolio-originals',
  FALSE,
  52428800,  -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 공개 이미지 (public): 누구나 읽기 가능
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-public',
  'portfolio-public',
  TRUE,
  20971520,  -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 시스템 템플릿 자산 (public): 누구나 읽기 가능
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-template-assets',
  'system-template-assets',
  TRUE,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;


-- ── 2. portfolio-originals policies (private) ─────────────────
-- 경로: {user_id}/{portfolio_id}/{filename}
-- 첫 번째 폴더 세그먼트가 자신의 user_id와 일치해야 업로드/조회/삭제 가능

CREATE POLICY "portfolio_originals_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-originals'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "portfolio_originals_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'portfolio-originals'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "portfolio_originals_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-originals'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );


-- ── 3. portfolio-public policies (public read) ────────────────
-- 경로: {user_id}/{portfolio_id}/{filename}
-- 누구나 읽기, 소유자만 업로드/삭제

CREATE POLICY "portfolio_public_anyone_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-public');

CREATE POLICY "portfolio_public_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-public'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "portfolio_public_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-public'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );


-- ── 4. system-template-assets policies (public read) ─────────
-- 경로: {template_code}/{filename}
-- 누구나 읽기, 업로드/삭제는 서비스 롤(service_role)만 가능

CREATE POLICY "system_template_assets_anyone_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'system-template-assets');

-- 업로드/삭제는 service_role 키로만 가능 (일반 사용자 정책 없음)
