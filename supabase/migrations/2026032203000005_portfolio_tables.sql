-- ============================================================
-- 00005_portfolio_tables.sql
-- Portfolio-related tables: templates, portfolios, images,
-- tags, portfolio_tags, bookmarks
-- ============================================================

-- ── 0. Custom ENUM Types (already created in 00002_enum_types.sql) ──

-- ── 1. portfolio_templates ───────────────────────────────────
-- code: 템플릿 고유 코드 (slug 역할, e.g. 'minimal-grid')
CREATE TABLE portfolio_templates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT        NOT NULL UNIQUE,
  name              TEXT        NOT NULL,
  description       TEXT,
  preview_image_path TEXT,
  layout_schema     JSONB       NOT NULL DEFAULT '{}',
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order        SMALLINT    NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_templates_code      ON portfolio_templates (code);
CREATE INDEX idx_portfolio_templates_active    ON portfolio_templates (is_active, sort_order) WHERE is_active = TRUE;

ALTER TABLE portfolio_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_templates_select_public"
  ON portfolio_templates FOR SELECT
  USING (is_active = TRUE);


-- ── 2. portfolios ────────────────────────────────────────────
CREATE TABLE portfolios (
  id                      UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                UUID                  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id             UUID                  REFERENCES portfolio_templates(id) ON DELETE SET NULL,
  slug                    TEXT                  NOT NULL UNIQUE,
  title                   TEXT                  NOT NULL,
  summary                 TEXT                  NOT NULL DEFAULT '',
  description             TEXT,
  starting_price_krw      BIGINT,
  duration_days           SMALLINT,
  template_customization  JSONB                 NOT NULL DEFAULT '{}',
  status                  portfolio_status      NOT NULL DEFAULT 'draft',
  visibility              portfolio_visibility  NOT NULL DEFAULT 'public',
  search_text             TEXT                  GENERATED ALWAYS AS (
                            title || ' ' || summary || ' ' || coalesce(description, '')
                          ) STORED,
  view_count              INTEGER               NOT NULL DEFAULT 0,
  bookmark_count          INTEGER               NOT NULL DEFAULT 0,
  published_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ           NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_portfolios_owner_id        ON portfolios (owner_id);
CREATE INDEX idx_portfolios_status          ON portfolios (status);
CREATE INDEX idx_portfolios_slug            ON portfolios (slug);
CREATE INDEX idx_portfolios_published_at    ON portfolios (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_portfolios_search_text     ON portfolios USING gin (to_tsvector('simple', search_text));
CREATE INDEX idx_portfolios_not_deleted     ON portfolios (owner_id) WHERE deleted_at IS NULL;

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- 소유자: 자신의 포트폴리오 전체 접근 (soft-delete 포함)
CREATE POLICY "portfolios_owner_all"
  ON portfolios FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 비로그인/타 사용자: published + public + 삭제 안 된 것만 조회
CREATE POLICY "portfolios_published_select"
  ON portfolios FOR SELECT
  USING (
    status = 'published'
    AND visibility = 'public'
    AND deleted_at IS NULL
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_portfolios_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_portfolios_updated_at();


-- ── 3. portfolio_images ──────────────────────────────────────
CREATE TABLE portfolio_images (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id    UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  original_path   TEXT        NOT NULL,  -- storage: portfolio-originals bucket
  display_path    TEXT,                  -- storage: portfolio-public bucket (web-optimized)
  thumb_path      TEXT,                  -- storage: portfolio-public bucket (thumbnail)
  alt_text        TEXT,
  caption         TEXT,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  is_cover        BOOLEAN     NOT NULL DEFAULT FALSE,
  width           INTEGER,
  height          INTEGER,
  file_size_bytes BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 같은 포트폴리오 내 sort_order 중복 방지
  UNIQUE (portfolio_id, sort_order)
);

-- 포트폴리오당 커버 이미지는 하나만 허용 (partial unique)
CREATE UNIQUE INDEX idx_portfolio_images_cover
  ON portfolio_images (portfolio_id)
  WHERE is_cover = TRUE;

CREATE INDEX idx_portfolio_images_portfolio_id  ON portfolio_images (portfolio_id);
CREATE INDEX idx_portfolio_images_sort_order    ON portfolio_images (portfolio_id, sort_order);

ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

-- 소유자: 이미지 전체 관리
CREATE POLICY "portfolio_images_owner_all"
  ON portfolio_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_images.portfolio_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_images.portfolio_id
        AND p.owner_id = auth.uid()
    )
  );

-- published + public 포트폴리오 이미지: 누구나 조회
CREATE POLICY "portfolio_images_published_select"
  ON portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_images.portfolio_id
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.deleted_at IS NULL
    )
  );


-- ── 4. tags ──────────────────────────────────────────────────
CREATE TABLE tags (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT         NOT NULL UNIQUE,
  name       TEXT         NOT NULL,
  category   tag_category NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_category   ON tags (category, sort_order) WHERE is_active = TRUE;
CREATE INDEX idx_tags_slug       ON tags (slug);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select_public"
  ON tags FOR SELECT
  USING (TRUE);


-- ── 5. portfolio_tags ────────────────────────────────────────
CREATE TABLE portfolio_tags (
  portfolio_id UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  tag_id       UUID        NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (portfolio_id, tag_id)
);

CREATE INDEX idx_portfolio_tags_tag_id ON portfolio_tags (tag_id);

ALTER TABLE portfolio_tags ENABLE ROW LEVEL SECURITY;

-- 소유자: INSERT
CREATE POLICY "portfolio_tags_owner_insert"
  ON portfolio_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_tags.portfolio_id
        AND p.owner_id = auth.uid()
    )
  );

-- 소유자: DELETE
CREATE POLICY "portfolio_tags_owner_delete"
  ON portfolio_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_tags.portfolio_id
        AND p.owner_id = auth.uid()
    )
  );

-- published + public 포트폴리오 태그: 누구나 조회
CREATE POLICY "portfolio_tags_published_select"
  ON portfolio_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = portfolio_tags.portfolio_id
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.deleted_at IS NULL
    )
  );


-- ── 6. bookmarks ─────────────────────────────────────────────
CREATE TABLE bookmarks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_id UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, portfolio_id)
);

CREATE INDEX idx_bookmarks_user_id      ON bookmarks (user_id);
CREATE INDEX idx_bookmarks_portfolio_id ON bookmarks (portfolio_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 본인 북마크만 CRUD
CREATE POLICY "bookmarks_owner_all"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
