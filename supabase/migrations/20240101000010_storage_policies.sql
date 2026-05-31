-- ============================================================
-- MIGRATION: 20240101000010_storage_policies
-- Storage bucket access policies.
--
-- PREREQUISITE: Create the following buckets in the Supabase
-- Dashboard (Storage > New Bucket) BEFORE running this migration:
--
--   1. org-assets
--      Private: true
--      File size limit: 5 MB
--      Allowed MIME types: image/png, image/jpeg, image/svg+xml
--
--   2. complaint-attachments
--      Private: true
--      File size limit: 20 MB
--      Allowed MIME types: image/*, application/pdf
--
-- Alternatively, create via Supabase CLI:
--   supabase storage create org-assets --public=false
--   supabase storage create complaint-attachments --public=false
-- ============================================================

-- ============================================================
-- BUCKET: org-assets
-- Stores organization logos and theme images.
-- Only back_office may upload or update.
-- All authenticated users may view (needed to display logos in UI).
-- ============================================================

CREATE POLICY "org_assets_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND get_current_user_role() = 'back_office'
  );

CREATE POLICY "org_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND get_current_user_role() = 'back_office'
  );

CREATE POLICY "org_assets_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'org-assets');

-- ============================================================
-- BUCKET: complaint-attachments
-- Reserved for Phase 2 (photo evidence, PDF attachments).
-- call_centre and line_man may upload.
-- All authenticated users may view.
-- Only back_office may delete.
-- ============================================================

CREATE POLICY "complaint_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() IN ('call_centre', 'line_man')
  );

CREATE POLICY "complaint_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'complaint-attachments');

CREATE POLICY "complaint_attachments_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() = 'back_office'
  );
