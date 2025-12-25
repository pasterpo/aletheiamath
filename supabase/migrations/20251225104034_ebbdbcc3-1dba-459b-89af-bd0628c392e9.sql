-- Video Categories
CREATE TABLE public.video_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Videos
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.video_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  youtube_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'olympiad')),
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video Progress Tracking
CREATE TABLE public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- IMO Waitlist
CREATE TABLE public.imo_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  country TEXT,
  current_level TEXT CHECK (current_level IN ('beginner', 'intermediate', 'advanced', 'national_olympiad', 'international_olympiad')),
  motivation TEXT,
  experience TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Problem Categories (Algebra, Geometry, Number Theory, Combinatorics)
CREATE TABLE public.problem_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Problems Archive
CREATE TABLE public.problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  hints TEXT[],
  solution TEXT,
  source TEXT,
  year INTEGER,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Solution Submissions
CREATE TABLE public.solution_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  solution_text TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'correct', 'partial', 'incorrect')) DEFAULT 'pending',
  feedback TEXT,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Math Duels
CREATE TABLE public.duels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID,
  problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')) DEFAULT 'waiting',
  challenger_answer TEXT,
  opponent_answer TEXT,
  challenger_time_seconds INTEGER,
  opponent_time_seconds INTEGER,
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Achievements/Badges
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT CHECK (category IN ('learning', 'duels', 'problems', 'community', 'special')),
  points INTEGER DEFAULT 10,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- User Stats/Leaderboard
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  duels_won INTEGER DEFAULT 0,
  duels_played INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imo_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Public read policies for content tables
CREATE POLICY "Anyone can view video categories" ON public.video_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Anyone can view problem categories" ON public.problem_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view published problems" ON public.problems FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can view their own video progress" ON public.video_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own video progress" ON public.video_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own video progress" ON public.video_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can join IMO waitlist" ON public.imo_waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own waitlist entry" ON public.imo_waitlist FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own submissions" ON public.solution_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit solutions" ON public.solution_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view duels they're in" ON public.duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id OR status = 'waiting');
CREATE POLICY "Users can create duels" ON public.duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update duels they're in" ON public.duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can grant achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view user stats for leaderboard" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert their own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON public.problems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.video_categories (name, slug, description, icon, display_order) VALUES
('Algebra', 'algebra', 'Equations, inequalities, polynomials, and algebraic structures', '📐', 1),
('Geometry', 'geometry', 'Euclidean geometry, transformations, and coordinate geometry', '📏', 2),
('Number Theory', 'number-theory', 'Divisibility, primes, modular arithmetic, and Diophantine equations', '🔢', 3),
('Combinatorics', 'combinatorics', 'Counting, graph theory, and combinatorial arguments', '🎲', 4),
('Analysis', 'analysis', 'Limits, sequences, series, and calculus', '📈', 5),
('Problem Solving', 'problem-solving', 'General strategies and mathematical thinking', '💡', 6);

INSERT INTO public.problem_categories (name, slug, description, color) VALUES
('Algebra', 'algebra', 'Algebraic equations, inequalities, and functional equations', '#3B82F6'),
('Geometry', 'geometry', 'Euclidean and projective geometry problems', '#10B981'),
('Number Theory', 'number-theory', 'Properties of integers and prime numbers', '#8B5CF6'),
('Combinatorics', 'combinatorics', 'Counting and discrete mathematics', '#F59E0B');

-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
('First Steps', 'Watch your first video', '🎬', 'learning', 10, 'videos_watched', 1),
('Video Scholar', 'Watch 10 videos', '📚', 'learning', 50, 'videos_watched', 10),
('Problem Solver', 'Solve your first problem', '✅', 'problems', 10, 'problems_solved', 1),
('Math Warrior', 'Solve 25 problems', '⚔️', 'problems', 100, 'problems_solved', 25),
('Duel Champion', 'Win your first duel', '🏆', 'duels', 25, 'duels_won', 1),
('Undefeated', 'Win 10 duels', '👑', 'duels', 150, 'duels_won', 10),
('Streak Master', 'Maintain a 7-day streak', '🔥', 'special', 75, 'streak', 7),
('Century Club', 'Earn 100 total points', '💯', 'special', 50, 'total_points', 100);

-- Insert sample videos
INSERT INTO public.videos (category_id, title, description, youtube_id, difficulty, tags, is_featured) VALUES
((SELECT id FROM video_categories WHERE slug = 'algebra'), 'Introduction to Olympiad Algebra', 'Master the foundational algebraic techniques used in mathematical olympiads', 'dQw4w9WgXcQ', 'intermediate', ARRAY['algebra', 'olympiad', 'introduction'], true),
((SELECT id FROM video_categories WHERE slug = 'geometry'), 'The Power of a Point', 'Discover this elegant theorem and its applications in competition geometry', 'dQw4w9WgXcQ', 'advanced', ARRAY['geometry', 'circles', 'power of point'], true),
((SELECT id FROM video_categories WHERE slug = 'number-theory'), 'Modular Arithmetic Fundamentals', 'Essential techniques for solving number theory problems', 'dQw4w9WgXcQ', 'beginner', ARRAY['number theory', 'modular', 'basics'], false),
((SELECT id FROM video_categories WHERE slug = 'combinatorics'), 'Bijective Proofs', 'Learn to prove identities through elegant counting arguments', 'dQw4w9WgXcQ', 'advanced', ARRAY['combinatorics', 'proofs', 'bijection'], true),
((SELECT id FROM video_categories WHERE slug = 'problem-solving'), 'How to Approach Hard Problems', 'Strategies and mindset for tackling challenging mathematical problems', 'dQw4w9WgXcQ', 'intermediate', ARRAY['strategy', 'problem solving', 'mindset'], true);

-- Insert sample problems
INSERT INTO public.problems (category_id, title, statement, hints, solution, source, year, difficulty, tags) VALUES
((SELECT id FROM problem_categories WHERE slug = 'algebra'), 'Symmetric Sum', 'Let $a$, $b$, $c$ be positive real numbers such that $abc = 1$. Prove that $a + b + c \geq 3$.', ARRAY['Consider AM-GM inequality', 'Apply it to a, b, c directly'], 'By AM-GM: $(a + b + c)/3 \geq \sqrt[3]{abc} = 1$, so $a + b + c \geq 3$.', 'Classic', NULL, 3, ARRAY['inequality', 'am-gm']),
((SELECT id FROM problem_categories WHERE slug = 'geometry'), 'Triangle Incircle', 'In triangle $ABC$, the incircle touches side $BC$ at $D$. Prove that $BD = s - b$ where $s$ is the semi-perimeter and $b = AC$.', ARRAY['Use the property of tangent lines from a point', 'Let the incircle touch AB at E and AC at F'], 'Tangent segments are equal: $AE = AF$, $BD = BF$, $CD = CE$. Since $AB + BC + CA = 2s$...', 'Classic', NULL, 4, ARRAY['incircle', 'tangent']),
((SELECT id FROM problem_categories WHERE slug = 'number-theory'), 'Divisibility Challenge', 'Prove that $n^5 - n$ is divisible by 30 for all positive integers $n$.', ARRAY['Factor the expression', 'Consider divisibility by 2, 3, and 5 separately'], 'Factor: $n^5 - n = n(n-1)(n+1)(n^2+1)$. The product of 3 consecutive integers is divisible by 6...', 'Classic', NULL, 5, ARRAY['divisibility', 'factoring']),
((SELECT id FROM problem_categories WHERE slug = 'combinatorics'), 'Handshake Problem', 'At a party with $n$ people, prove that the number of people who have shaken hands an odd number of times is even.', ARRAY['Count the total number of handshakes in two ways', 'Consider the sum of degrees'], 'Each handshake contributes 2 to the total degree sum. So the sum is even. If odd-degree vertices were odd in count...', 'Classic', NULL, 4, ARRAY['graph theory', 'parity']);