-- 00014_chat_storage.sql
-- Storage: chat-attachments private bucket + access policies

-- ============================================================
-- Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS Policies
-- Participants access via signed URL (bucket is private).
-- Path convention: chat-attachments/{conversation_id}/{message_id}/{filename}
-- ============================================================

-- SELECT: only conversation participants can read objects
CREATE POLICY "chat_attachments_select_participant"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
        FROM public.conversation_participants cp
       WHERE cp.conversation_id = (string_to_array(name, '/'))[1]::uuid
         AND cp.user_id = auth.uid()
    )
  );

-- INSERT: only authenticated participants of the conversation can upload
CREATE POLICY "chat_attachments_insert_participant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
        FROM public.conversation_participants cp
       WHERE cp.conversation_id = (string_to_array(name, '/'))[1]::uuid
         AND cp.user_id = auth.uid()
    )
  );

-- UPDATE: only the uploader (owner) can update
CREATE POLICY "chat_attachments_update_owner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

-- DELETE: only the uploader (owner) can delete
CREATE POLICY "chat_attachments_delete_owner"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );
