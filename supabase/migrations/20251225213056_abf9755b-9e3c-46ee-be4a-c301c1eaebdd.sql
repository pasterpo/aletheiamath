-- Add section field to problems (duels, problems, aletheiarating, all)
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS section text DEFAULT 'all';

-- Create user_attempted_problems table if not exists
CREATE TABLE IF NOT EXISTS public.user_attempted_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('correct', 'incorrect', 'skipped')),
  attempted_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE public.user_attempted_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" ON public.user_attempted_problems
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON public.user_attempted_problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user_global_daily_skips table if not exists
CREATE TABLE IF NOT EXISTS public.user_global_daily_skips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skip_date date NOT NULL DEFAULT CURRENT_DATE,
  skip_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, skip_date)
);

ALTER TABLE public.user_global_daily_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skips" ON public.user_global_daily_skips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skips" ON public.user_global_daily_skips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skips" ON public.user_global_daily_skips
  FOR UPDATE USING (auth.uid() = user_id);

-- Create discussion_topics table for forum-style discussions
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  message_count integer DEFAULT 0,
  last_message_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topics" ON public.discussion_topics
  FOR SELECT USING (true);

CREATE POLICY "Developers can create topics" ON public.discussion_topics
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can update topics" ON public.discussion_topics
  FOR UPDATE USING (has_role(auth.uid(), 'developer'));

CREATE POLICY "Developers can delete topics" ON public.discussion_topics
  FOR DELETE USING (has_role(auth.uid(), 'developer'));

-- Add topic_id to discussion_messages
ALTER TABLE public.discussion_messages ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.discussion_topics(id) ON DELETE CASCADE;
ALTER TABLE public.discussion_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- Create user_settings table for theme preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Add image_url to direct_messages for image sharing
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Enable realtime for discussion_topics
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_attempted_problems;