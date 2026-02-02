-- Migration: 004_gailgpt_tables.sql
-- GailGPT chat functionality with conversations, messages, files, and artifacts

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE public.gailgpt_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gailgpt_conversations_user ON gailgpt_conversations(user_id);
CREATE INDEX idx_gailgpt_conversations_updated ON gailgpt_conversations(updated_at DESC);

ALTER TABLE gailgpt_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON gailgpt_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON gailgpt_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON gailgpt_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON gailgpt_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE public.gailgpt_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.gailgpt_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  thinking TEXT,
  tool_calls JSONB DEFAULT '[]',
  artifacts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gailgpt_messages_conversation ON gailgpt_messages(conversation_id);
CREATE INDEX idx_gailgpt_messages_created ON gailgpt_messages(conversation_id, created_at);

ALTER TABLE gailgpt_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON gailgpt_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gailgpt_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON gailgpt_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gailgpt_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- UPLOADED FILES TABLE
-- ============================================
CREATE TABLE public.gailgpt_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.gailgpt_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gailgpt_files_conversation ON gailgpt_files(conversation_id);
CREATE INDEX idx_gailgpt_files_user ON gailgpt_files(user_id);

ALTER TABLE gailgpt_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON gailgpt_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON gailgpt_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON gailgpt_files FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ARTIFACTS TABLE (Generated documents)
-- ============================================
CREATE TABLE public.gailgpt_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.gailgpt_messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.gailgpt_conversations(id) ON DELETE CASCADE NOT NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('acord_25', 'acord_24', 'acord_27', 'acord_28', 'document', 'code', 'table', 'policy_analysis', 'comparison_table', 'report')),
  title TEXT,
  content JSONB NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gailgpt_artifacts_conversation ON gailgpt_artifacts(conversation_id);
CREATE INDEX idx_gailgpt_artifacts_message ON gailgpt_artifacts(message_id);

ALTER TABLE gailgpt_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifacts in own conversations"
  ON gailgpt_artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gailgpt_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert artifacts in own conversations"
  ON gailgpt_artifacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gailgpt_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_gailgpt_conversations_updated_at
  BEFORE UPDATE ON gailgpt_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET FOR GAILGPT FILES
-- ============================================
-- Note: Run these in Supabase Dashboard or via supabase CLI
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gailgpt-files', 'gailgpt-files', false);

-- Storage RLS policies (run in Supabase Dashboard):
-- CREATE POLICY "Users can upload files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'gailgpt-files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- CREATE POLICY "Users can read own files"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'gailgpt-files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- CREATE POLICY "Users can delete own files"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'gailgpt-files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
