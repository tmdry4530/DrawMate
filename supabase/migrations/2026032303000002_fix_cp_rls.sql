-- Fix: Allow participants to see other participants in the same conversation
-- Previous policy only allowed seeing own row, preventing peer discovery

DROP POLICY IF EXISTS "cp_select_own" ON public.conversation_participants;

CREATE POLICY "cp_select_same_conversation"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants my
      WHERE my.conversation_id = conversation_participants.conversation_id
        AND my.user_id = auth.uid()
    )
  );
