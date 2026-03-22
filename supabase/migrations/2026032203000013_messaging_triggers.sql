-- 00013_messaging_triggers.sql
-- Triggers: update conversation last_message, create notification on message insert

-- ============================================================
-- Trigger: update conversations.last_message on new message
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_on_message_insert_update_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_id = NEW.id,
         last_message_at = NEW.created_at,
         updated_at      = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_on_message_insert_update_conversation();

-- ============================================================
-- Trigger: create notification for other participants on new message
-- ============================================================

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
  -- Skip notifications for deleted/system messages
  IF NEW.deleted_at IS NOT NULL OR NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- Get sender display name
  SELECT COALESCE(display_name, 'Someone')
    INTO v_sender_name
    FROM public.profiles
   WHERE id = NEW.sender_id;

  -- Build preview body
  v_preview := CASE
    WHEN NEW.message_type = 'text' THEN
      left(COALESCE(NEW.body, ''), 200)
    WHEN NEW.message_type IN ('image', 'file') THEN
      v_sender_name || ' sent a ' || NEW.message_type
    ELSE
      'New message'
  END;

  -- Insert notification for every participant except the sender
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

CREATE TRIGGER on_message_insert_notify_participants
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_on_message_insert_notify_participants();
