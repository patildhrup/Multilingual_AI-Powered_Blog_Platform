-- ============================================
-- Migration: Add metadata column to posts table
-- Run this if you already created the posts table
-- ============================================

-- Add metadata column if it doesn't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'metadata';
