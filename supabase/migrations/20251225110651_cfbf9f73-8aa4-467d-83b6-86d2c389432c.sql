-- First, drop existing policies that reference the old enum
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Drop the old has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Create new enum type for the four-tier RBAC
CREATE TYPE public.new_app_role AS ENUM ('developer', 'staff', 'moderator', 'member');

-- Update user_roles table to use new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.new_app_role USING 
    CASE role::text 
      WHEN 'admin' THEN 'developer'::public.new_app_role
      WHEN 'moderator' THEN 'moderator'::public.new_app_role
      WHEN 'user' THEN 'member'::public.new_app_role
    END,
  ALTER COLUMN role SET DEFAULT 'member'::public.new_app_role;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.new_app_role RENAME TO app_role;

-- Recreate the has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has role at level or higher
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'developer' OR
        (role = 'staff' AND _min_role IN ('staff', 'moderator', 'member')) OR
        (role = 'moderator' AND _min_role IN ('moderator', 'member')) OR
        (role = 'member' AND _min_role = 'member')
      )
  )
$$;

-- Recreate RLS policy for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow developers to view all roles
CREATE POLICY "Developers can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'developer'));

-- Allow developers to update roles
CREATE POLICY "Developers can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'developer'));

-- Add answer column to problems table for verification
ALTER TABLE public.problems 
ADD COLUMN IF NOT EXISTS answer TEXT,
ADD COLUMN IF NOT EXISTS answer_type TEXT DEFAULT 'exact' CHECK (answer_type IN ('exact', 'numeric', 'fraction'));

-- Create table to track daily skips per user per category
CREATE TABLE IF NOT EXISTS public.user_daily_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.problem_categories(id) ON DELETE CASCADE,
  skip_count INTEGER NOT NULL DEFAULT 0,
  skip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, skip_date)
);

-- Enable RLS on skip tracking
ALTER TABLE public.user_daily_skips ENABLE ROW LEVEL SECURITY;

-- RLS policies for skip tracking
CREATE POLICY "Users can view their own skips"
ON public.user_daily_skips
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skips"
ON public.user_daily_skips
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skips"
ON public.user_daily_skips
FOR UPDATE
USING (auth.uid() = user_id);

-- Add rating column to user_stats if not exists
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1000;

-- Update handle_new_user function to assign 'member' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  INSERT INTO public.user_stats (user_id, rating)
  VALUES (NEW.id, 1000);
  
  RETURN NEW;
END;
$$;

-- Allow developers and staff to manage problems
CREATE POLICY "Developers and Staff can insert problems"
ON public.problems
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'developer') OR 
  public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Developers and Staff can update problems"
ON public.problems
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'developer') OR 
  public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Developers can delete problems"
ON public.problems
FOR DELETE
USING (public.has_role(auth.uid(), 'developer'));