-- 00016_verification_phase2.sql
-- Production verification fixes:
-- 1) atomic portfolio tag replacement
-- 2) atomic bookmark toggle + counter sync
-- 3) profile delete policy
-- 4) notification preference columns

CREATE OR REPLACE FUNCTION public.replace_portfolio_tags(
  p_portfolio_id uuid,
  p_tag_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT owner_id
    INTO v_owner_id
    FROM public.portfolios
   WHERE id = p_portfolio_id
     AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'portfolio_not_found';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  DELETE FROM public.portfolio_tags
   WHERE portfolio_id = p_portfolio_id;

  IF COALESCE(array_length(p_tag_ids, 1), 0) > 0 THEN
    INSERT INTO public.portfolio_tags (portfolio_id, tag_id)
    SELECT p_portfolio_id, tag_id
      FROM unnest(p_tag_ids) AS tag_id
    ON CONFLICT (portfolio_id, tag_id) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_portfolio_tags(uuid, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_portfolio_bookmark(
  p_portfolio_id uuid,
  p_should_bookmark boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  PERFORM 1
    FROM public.portfolios
   WHERE id = p_portfolio_id
     AND deleted_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'portfolio_not_found';
  END IF;

  IF p_should_bookmark THEN
    INSERT INTO public.bookmarks (user_id, portfolio_id)
    VALUES (v_user_id, p_portfolio_id)
    ON CONFLICT (user_id, portfolio_id) DO NOTHING;
  ELSE
    DELETE FROM public.bookmarks
     WHERE user_id = v_user_id
       AND portfolio_id = p_portfolio_id;
  END IF;

  UPDATE public.portfolios p
     SET bookmark_count = (
       SELECT COUNT(*)::int
         FROM public.bookmarks b
        WHERE b.portfolio_id = p.id
     )
   WHERE p.id = p_portfolio_id
     AND p.deleted_at IS NULL;

  RETURN p_should_bookmark;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_portfolio_bookmark(uuid, boolean) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'profiles'
       AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON public.profiles FOR DELETE
      USING (auth.uid() = id);
  END IF;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_new_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_bookmark boolean NOT NULL DEFAULT true;
