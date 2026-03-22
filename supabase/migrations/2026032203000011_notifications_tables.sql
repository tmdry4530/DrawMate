-- 00011_notifications_tables.sql
-- Notifications and push_subscriptions tables

-- ENUM (already created in 00002_enum_types.sql)

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.notifications (
  id          uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid                     NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL,
  title       varchar(100)             NOT NULL,
  body        varchar(300)             NOT NULL,
  entity_type varchar(50),
  entity_id   uuid,
  payload     jsonb                    NOT NULL DEFAULT '{}',
  read_at     timestamptz,
  created_at  timestamptz              NOT NULL DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL UNIQUE,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  user_agent  text,
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_notifications_user_recent
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- notifications: own rows only
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- push_subscriptions: own rows only
CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
