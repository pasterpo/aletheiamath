-- Add pause tracking for Lichess-style progressive delays
ALTER TABLE tournament_participants 
ADD COLUMN IF NOT EXISTS pause_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_paused_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS can_rejoin_at timestamp with time zone;

-- Add game result tracking for proper scoring
ALTER TABLE tournament_games
ADD COLUMN IF NOT EXISTS result_type text DEFAULT 'pending';

-- Create featured duels table for showing top games
CREATE TABLE IF NOT EXISTS tournament_featured_duels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES tournament_games(id) ON DELETE CASCADE,
  player_a_name text NOT NULL,
  player_b_name text NOT NULL,
  player_a_rating integer NOT NULL DEFAULT 1000,
  player_b_rating integer NOT NULL DEFAULT 1000,
  player_a_rank integer,
  player_b_rank integer,
  average_rating integer NOT NULL DEFAULT 1000,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE tournament_featured_duels ENABLE ROW LEVEL SECURITY;

-- Anyone can view featured duels
CREATE POLICY "Anyone can view featured duels"
ON tournament_featured_duels
FOR SELECT
USING (true);

-- System can manage featured duels (via service role)
CREATE POLICY "Authenticated users can manage featured duels"
ON tournament_featured_duels
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_featured_duels_tournament ON tournament_featured_duels(tournament_id);
CREATE INDEX IF NOT EXISTS idx_featured_duels_rating ON tournament_featured_duels(average_rating DESC);