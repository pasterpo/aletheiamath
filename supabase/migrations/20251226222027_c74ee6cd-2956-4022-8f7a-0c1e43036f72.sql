-- Create tournament type enum
CREATE TYPE public.tournament_type AS ENUM ('arena', 'swiss');
CREATE TYPE public.tournament_status AS ENUM ('scheduled', 'active', 'finished');
CREATE TYPE public.participant_status AS ENUM ('registered', 'in_lobby', 'in_game', 'paused', 'withdrawn');
CREATE TYPE public.game_status AS ENUM ('countdown', 'active', 'finished');

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tournament_type tournament_type NOT NULL DEFAULT 'arena',
  status tournament_status NOT NULL DEFAULT 'scheduled',
  category_id UUID REFERENCES public.problem_categories(id),
  min_rating INTEGER DEFAULT 0,
  max_rating INTEGER DEFAULT 9999,
  min_rated_games INTEGER DEFAULT 0,
  time_per_problem_seconds INTEGER NOT NULL DEFAULT 180,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_rounds INTEGER DEFAULT 5,
  current_round INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status participant_status NOT NULL DEFAULT 'registered',
  score DECIMAL(10,1) NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  is_on_fire BOOLEAN NOT NULL DEFAULT false,
  is_berserk_next BOOLEAN NOT NULL DEFAULT false,
  last_opponent_id UUID,
  lobby_since TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Create tournament games table
CREATE TABLE public.tournament_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  player_a_id UUID NOT NULL,
  player_b_id UUID,
  problem_id UUID REFERENCES public.problems(id),
  status game_status NOT NULL DEFAULT 'countdown',
  player_a_answer TEXT,
  player_b_answer TEXT,
  player_a_time_ms INTEGER,
  player_b_time_ms INTEGER,
  player_a_mistakes INTEGER NOT NULL DEFAULT 0,
  player_b_mistakes INTEGER NOT NULL DEFAULT 0,
  player_a_berserk BOOLEAN NOT NULL DEFAULT false,
  player_b_berserk BOOLEAN NOT NULL DEFAULT false,
  winner_id UUID,
  is_draw BOOLEAN NOT NULL DEFAULT false,
  is_bye BOOLEAN NOT NULL DEFAULT false,
  points_awarded_a DECIMAL(10,1) DEFAULT 0,
  points_awarded_b DECIMAL(10,1) DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_games ENABLE ROW LEVEL SECURITY;

-- Tournament policies
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "Developers and staff can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Developers and staff can update tournaments" ON public.tournaments
  FOR UPDATE USING (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Developers can delete tournaments" ON public.tournaments
  FOR DELETE USING (has_role(auth.uid(), 'developer'));

-- Participant policies
CREATE POLICY "Anyone can view participants" ON public.tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.tournament_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from tournaments" ON public.tournament_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Game policies
CREATE POLICY "Participants can view tournament games" ON public.tournament_games
  FOR SELECT USING (true);

CREATE POLICY "System can create games" ON public.tournament_games
  FOR INSERT WITH CHECK (auth.uid() = player_a_id OR auth.uid() = player_b_id);

CREATE POLICY "Players can update their games" ON public.tournament_games
  FOR UPDATE USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

-- Create indexes for performance
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON public.tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_status ON public.tournament_participants(status);
CREATE INDEX idx_tournament_games_tournament ON public.tournament_games(tournament_id);
CREATE INDEX idx_tournament_games_players ON public.tournament_games(player_a_id, player_b_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_start_time ON public.tournaments(start_time);

-- Enable realtime for tournament tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_games;