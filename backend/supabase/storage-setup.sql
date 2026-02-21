-- ============================================
-- Supabase Storage Setup
-- Bucket: blog-attachments
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-attachments', 'blog-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for the bucket

-- Allow public access to read files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-attachments' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-attachments' 
  AND auth.uid() = owner
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-attachments' 
  AND auth.uid() = owner
);
