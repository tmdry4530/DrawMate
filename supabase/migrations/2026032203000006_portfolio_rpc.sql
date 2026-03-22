-- ============================================================
-- 00006_portfolio_rpc.sql
-- RPCs: publish_portfolio, reorder_portfolio_images,
--       increment_portfolio_view
-- ============================================================

-- ── 1. publish_portfolio ─────────────────────────────────────
-- 발행 전 검증:
--   - 이미지 >= 1
--   - field 카테고리 태그 >= 1
--   - profiles.display_name, profiles.role NOT NULL
CREATE OR REPLACE FUNCTION publish_portfolio(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id     UUID;
  v_image_count  INTEGER;
  v_tag_count    INTEGER;
  v_display_name TEXT;
  v_role         TEXT;
BEGIN
  -- 소유권 확인
  SELECT owner_id INTO v_owner_id
  FROM portfolios
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'portfolio_not_found';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- 이미지 수 확인
  SELECT COUNT(*) INTO v_image_count
  FROM portfolio_images
  WHERE portfolio_id = p_id;

  IF v_image_count < 1 THEN
    RAISE EXCEPTION 'requires_at_least_one_image';
  END IF;

  -- field 카테고리 태그 수 확인
  SELECT COUNT(*) INTO v_tag_count
  FROM portfolio_tags pt
  JOIN tags t ON t.id = pt.tag_id
  WHERE pt.portfolio_id = p_id
    AND t.category = 'field';

  IF v_tag_count < 1 THEN
    RAISE EXCEPTION 'requires_at_least_one_field_tag';
  END IF;

  -- 프로필 완성도 확인
  SELECT display_name, role INTO v_display_name, v_role
  FROM profiles
  WHERE id = v_owner_id;

  IF v_display_name IS NULL OR v_role IS NULL THEN
    RAISE EXCEPTION 'profile_incomplete';
  END IF;

  -- 발행 처리
  UPDATE portfolios
  SET status       = 'published',
      published_at = now()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION publish_portfolio(UUID) TO authenticated;


-- ── 2. reorder_portfolio_images ──────────────────────────────
-- ordered_ids: 새 순서대로 정렬된 image uuid 배열
-- sort_order는 배열 인덱스(0-based)로 재할당
CREATE OR REPLACE FUNCTION reorder_portfolio_images(
  p_id        UUID,
  ordered_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  i          INTEGER;
BEGIN
  -- 소유권 확인
  SELECT owner_id INTO v_owner_id
  FROM portfolios
  WHERE id = p_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'portfolio_not_found';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- sort_order 업데이트 (배열 인덱스 기반, 0-based)
  FOR i IN 1 .. array_length(ordered_ids, 1)
  LOOP
    UPDATE portfolio_images
    SET sort_order = i - 1
    WHERE id           = ordered_ids[i]
      AND portfolio_id = p_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION reorder_portfolio_images(UUID, UUID[]) TO authenticated;


-- ── 3. increment_portfolio_view ──────────────────────────────
-- 공개된 포트폴리오 조회수 증가 (소유자 본인 제외)
CREATE OR REPLACE FUNCTION increment_portfolio_view(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_status   portfolio_status;
BEGIN
  SELECT owner_id, status INTO v_owner_id, v_status
  FROM portfolios
  WHERE id = p_id AND deleted_at IS NULL;

  -- 발행된 포트폴리오만
  IF v_status IS DISTINCT FROM 'published' THEN
    RETURN;
  END IF;

  -- 소유자 본인은 카운트 제외
  IF auth.uid() IS NOT DISTINCT FROM v_owner_id THEN
    RETURN;
  END IF;

  UPDATE portfolios
  SET view_count = view_count + 1
  WHERE id = p_id;
END;
$$;

-- 비로그인 사용자도 조회수 증가 가능
GRANT EXECUTE ON FUNCTION increment_portfolio_view(UUID) TO anon, authenticated;
