-- 00015_hotfixes.sql
-- Runtime fixes for bookmark counters and messaging notification trigger

-- ------------------------------------------------------------
-- Bookmark counter RPCs
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_bookmark_count(p_portfolio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.portfolios
     SET bookmark_count = bookmark_count + 1
   WHERE id = p_portfolio_id
     AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_bookmark_count(p_portfolio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.portfolios
     SET bookmark_count = GREATEST(bookmark_count - 1, 0)
   WHERE id = p_portfolio_id
     AND deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_bookmark_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_bookmark_count(uuid) TO authenticated;

-- ------------------------------------------------------------
-- Message notification trigger hotfix
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_on_message_insert_notify_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name  text;
  v_preview      varchar(300);
BEGIN
  IF NEW.deleted_at IS NOT NULL OR NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, 'Someone')
    INTO v_sender_name
    FROM public.profiles
   WHERE id = NEW.sender_id;

  v_preview := CASE
    WHEN NEW.message_type = 'text' THEN
      left(COALESCE(NEW.body, ''), 200)
    ELSE
      v_sender_name || ' sent a message'
  END;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    payload
  )
  SELECT
    cp.user_id,
    'message_received'::public.notification_type,
    v_sender_name,
    v_preview,
    'message',
    NEW.id,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id',       NEW.sender_id,
      'message_type',    NEW.message_type
    )
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id <> NEW.sender_id
    AND (cp.muted_until IS NULL OR cp.muted_until < now());

  RETURN NEW;
END;
$$;
