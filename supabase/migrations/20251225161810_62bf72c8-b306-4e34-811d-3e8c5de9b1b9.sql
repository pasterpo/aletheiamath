-- Drop the existing difficulty check constraint first
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_difficulty_check;

-- Update existing problem difficulties from 1-10 to 10-100 (×10)
UPDATE public.problems SET difficulty = difficulty * 10 WHERE difficulty IS NOT NULL AND difficulty <= 10;

-- Add new check constraint for difficulty 10-100
ALTER TABLE public.problems ADD CONSTRAINT problems_difficulty_check CHECK (difficulty >= 10 AND difficulty <= 100);