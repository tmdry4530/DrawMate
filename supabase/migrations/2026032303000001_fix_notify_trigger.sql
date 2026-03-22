-- Fix: remove reference to non-existent 'username' column in profiles
CREATE OR REPLACE FUNCTION public.on_message_insert_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient uuid;
  v_sender_name text;
  v_preview varchar(300);
BEGIN
  IF NEW.deleted_at IS NOT NULL OR NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, 'Someone')
    INTO v_sender_name
    FROM public.profiles
   WHERE id = NEW.sender_id;

  v_preview := CASE
    WHEN NEW.message_type = 'text' THEN left(COALESCE(NEW.body, ''), 200)
    ELSE v_sender_name || ' sent a file'
  END;

  FOR v_recipient IN
    SELECT user_id FROM public.conversation_participants
     WHERE conversation_id = NEW.conversation_id
       AND user_id <> NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, payload)
    VALUES (
      v_recipient,
      'message_received',
      v_sender_name || '님의 새 메시지',
      v_preview,
      'conversation',
      NEW.conversation_id,
      jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;
