-- 00010_messaging_tables.sql
-- Conversations, participants, messages, message_attachments

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.conversations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type text        NOT NULL DEFAULT 'direct'
                                CHECK (conversation_type IN ('direct', 'group')),
  direct_key        varchar(100) UNIQUE,
  initiated_by      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_id   uuid,
  last_message_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  conversation_id       uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id               uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_message_id  uuid,
  last_read_at          timestamptz,
  muted_until           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type    text        NOT NULL DEFAULT 'text'
                              CHECK (message_type IN ('text', 'image', 'file', 'system')),
  body            text,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);

-- Add FK from conversations to messages after messages table exists
ALTER TABLE public.conversations
  ADD CONSTRAINT fk_conversations_last_message
  FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE TABLE public.message_attachments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   uuid        NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path text        NOT NULL,
  preview_path text,
  mime_type    text        NOT NULL,
  size_bytes   bigint      NOT NULL,
  width        integer,
  height       integer,
  sort_order   smallint    NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, sort_order)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- conversations
CREATE INDEX idx_conversations_last_message
  ON public.conversations (last_message_at DESC NULLS LAST, id DESC);

-- conversation_participants
CREATE INDEX idx_conversation_participants_user
  ON public.conversation_participants (user_id);

CREATE INDEX idx_conversation_participants_last_read
  ON public.conversation_participants (last_read_at);

-- messages
CREATE INDEX idx_messages_conversation_time
  ON public.messages (conversation_id, created_at DESC, id DESC);

CREATE INDEX idx_messages_active
  ON public.messages (conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments       ENABLE ROW LEVEL SECURITY;

-- conversations: only participants can SELECT
CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

-- conversation_participants: own rows SELECT/UPDATE
CREATE POLICY "cp_select_own"
  ON public.conversation_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "cp_update_own"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- messages: participant SELECT, sender INSERT
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_sender"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- message_attachments: participant SELECT, sender INSERT
CREATE POLICY "attachments_select_participant"
  ON public.message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.messages m
        JOIN public.conversation_participants cp
          ON cp.conversation_id = m.conversation_id
       WHERE m.id = message_attachments.message_id
         AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "attachments_insert_sender"
  ON public.message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.messages m
       WHERE m.id = message_attachments.message_id
         AND m.sender_id = auth.uid()
    )
  );
