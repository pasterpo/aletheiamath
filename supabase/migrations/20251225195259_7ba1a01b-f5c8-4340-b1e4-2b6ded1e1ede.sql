-- Add topic and subtopic columns to problems table
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS topic text;
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS subtopic text;

-- Create user_activity table to track all problem attempts with results for stats
CREATE TABLE IF NOT EXISTS public.user_problem_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id uuid REFERENCES public.problems(id) ON DELETE CASCADE,
  topic text,
  subtopic text,
  difficulty integer,
  is_correct boolean NOT NULL,
  time_taken_seconds integer,
  rating_change integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'practice', -- 'practice', 'duel', 'aletheiarating'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_problem_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_problem_stats
CREATE POLICY "Users can view their own stats" ON public.user_problem_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_problem_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view stats for leaderboard" ON public.user_problem_stats
  FOR SELECT USING (true);

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create direct messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for direct_messages
CREATE POLICY "Users can view their messages" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Create rating_history table for charts
CREATE TABLE IF NOT EXISTS public.rating_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  rating_change integer NOT NULL,
  source text NOT NULL DEFAULT 'practice',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for rating_history
CREATE POLICY "Anyone can view rating history" ON public.rating_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own history" ON public.rating_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;