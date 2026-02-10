-- Storage Bucket Setup for COI Generator V2
-- Run these in Supabase SQL Editor or create buckets via Dashboard

-- Note: Storage bucket creation via SQL requires superuser privileges
-- These commands are for documentation - create buckets via Dashboard instead:
--   1. Go to Storage in Supabase Dashboard
--   2. Create bucket "acord-templates" (private)
--   3. Create bucket "filled-certificates" (private)

-- Storage policies (run after creating buckets)

-- Policy: Allow authenticated users to read templates
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
SELECT
  'acord-templates',
  'Allow authenticated users to read templates',
  '(role() = ''authenticated'')',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies
  WHERE bucket_id = 'acord-templates' AND name = 'Allow authenticated users to read templates'
);

-- Policy: Allow service role to upload templates
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
SELECT
  'acord-templates',
  'Allow service role to upload templates',
  '(role() = ''service_role'')',
  '(role() = ''service_role'')'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies
  WHERE bucket_id = 'acord-templates' AND name = 'Allow service role to upload templates'
);

-- Policy: Allow users to read their own filled certificates
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
SELECT
  'filled-certificates',
  'Allow users to read own certificates',
  '(auth.uid()::text = (storage.foldername(name))[1])',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies
  WHERE bucket_id = 'filled-certificates' AND name = 'Allow users to read own certificates'
);

-- Policy: Allow users to upload to their folder
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
SELECT
  'filled-certificates',
  'Allow users to upload own certificates',
  '(auth.uid()::text = (storage.foldername(name))[1])',
  '(auth.uid()::text = (storage.foldername(name))[1])'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies
  WHERE bucket_id = 'filled-certificates' AND name = 'Allow users to upload own certificates'
);

-- Policy: Allow service role full access to filled-certificates
INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
SELECT
  'filled-certificates',
  'Service role full access',
  '(role() = ''service_role'')',
  '(role() = ''service_role'')'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies
  WHERE bucket_id = 'filled-certificates' AND name = 'Service role full access'
);
