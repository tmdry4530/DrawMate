-- 00012_messaging_rpc.sql
-- RPC: create_direct_conversation, mark_notifications_read

-- ============================================================
-- create_direct_conversation
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_direct_conversation(
  target_user_id      uuid,
  initial_message     text    DEFAULT NULL,
  source_portfolio_id uuid    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id     uuid := auth.uid();
  v_direct_key    varchar(100);
  v_conversation  uuid;
  v_msg_id        uuid;
BEGIN
  -- Build canonical direct_key: smaller_uuid:larger_uuid
  IF v_caller_id < target_user_id THEN
    v_direct_key := v_caller_id::text || ':' || target_user_id::text;
  ELSE
    v_direct_key := target_user_id::text || ':' || v_caller_id::text;
  END IF;

  -- Check for existing conversation
  SELECT id INTO v_conversation
    FROM public.conversations
   WHERE direct_key = v_direct_key;

  IF v_conversation IS NOT NULL THEN
    -- Conversation exists; optionally insert initial_message
    IF initial_message IS NOT NULL THEN
      INSERT INTO public.messages (conversation_id, sender_id, message_type, body, metadata)
      VALUES (
        v_conversation,
        v_caller_id,
        'text',
        initial_message,
        CASE WHEN source_portfolio_id IS NOT NULL
             THEN jsonb_build_object('source_portfolio_id', source_portfolio_id)
             ELSE '{}'::jsonb
        END
      )
      RETURNING id INTO v_msg_id;
    END IF;
    RETURN v_conversation;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (conversation_type, direct_key, initiated_by)
  VALUES ('direct', v_direct_key, v_caller_id)
  RETURNING id INTO v_conversation;

  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES
    (v_conversation, v_caller_id),
    (v_conversation, target_user_id);

  -- Optionally insert initial_message
  IF initial_message IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, message_type, body, metadata)
    VALUES (
      v_conversation,
      v_caller_id,
      'text',
      initial_message,
      CASE WHEN source_portfolio_id IS NOT NULL
           THEN jsonb_build_object('source_portfolio_id', source_portfolio_id)
           ELSE '{}'::jsonb
      END
    )
    RETURNING id INTO v_msg_id;
  END IF;

  RETURN v_conversation;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid, text, uuid)
  TO authenticated;

-- ============================================================
-- mark_notifications_read
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_notifications_read(
  notification_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
     SET read_at = now()
   WHERE id = ANY(notification_ids)
     AND user_id = auth.uid()
     AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid[])
  TO authenticated;
