import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface LiveGame {
  id: string;
  player_a_id: string;
  player_b_id: string | null;
  player_a_name: string;
  player_b_name: string;
  player_a_rating: number;
  player_b_rating: number;
  status: string;
  problem_title?: string;
  time_remaining?: number;
}

export function LiveMathTV() {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Get the current featured live game
  const { data: liveGame } = useQuery({
    queryKey: ['live-math-tv'],
    queryFn: async () => {
      // Get an active tournament game or duel
      const { data: games, error } = await supabase
        .from('tournament_games')
        .select(`
          id,
          player_a_id,
          player_b_id,
          status,
          started_at,
          problem:problems(title)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !games?.length) {
        // Try to get an active duel instead
        const { data: duels } = await supabase
          .from('duels')
          .select('*')
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1);

        if (duels?.length) {
          return {
            id: duels[0].id,
            player_a_id: duels[0].challenger_id,
            player_b_id: duels[0].opponent_id,
            player_a_name: '',
            player_b_name: '',
            player_a_rating: 1000,
            player_b_rating: 1000,
            status: 'active',
          } as LiveGame;
        }
        return null;
      }

      return games[0] as unknown as LiveGame;
    },
    refetchInterval: 5000,
  });

  // Get player profiles for the live game
  const { data: players } = useQuery({
    queryKey: ['live-game-players', liveGame?.id],
    queryFn: async () => {
      if (!liveGame) return null;

      const playerIds = [liveGame.player_a_id, liveGame.player_b_id].filter(Boolean);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', playerIds);

      const { data: stats } = await supabase
        .from('user_stats')
        .select('user_id, rating')
        .in('user_id', playerIds);

      const profileMap: Record<string, { name: string; rating: number }> = {};
      
      profiles?.forEach(p => {
        profileMap[p.user_id] = {
          name: p.full_name || 'Anonymous',
          rating: stats?.find(s => s.user_id === p.user_id)?.rating || 1000
        };
      });

      return profileMap;
    },
    enabled: !!liveGame,
  });

  // Simulate elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playerAName = players?.[liveGame?.player_a_id || '']?.name || 'Player A';
  const playerBName = players?.[liveGame?.player_b_id || '']?.name || 'Player B';
  const playerARating = players?.[liveGame?.player_a_id || '']?.rating || 1000;
  const playerBRating = players?.[liveGame?.player_b_id || '']?.rating || 1000;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Tv className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-foreground">Math TV</span>
          {liveGame && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <Link to="/duels" className="text-xs text-muted-foreground hover:text-primary">
          Watch all →
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        {liveGame ? (
          <div className="space-y-4">
            {/* Players */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{playerAName}</p>
                  <p className="text-xs text-muted-foreground">{playerARating}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(elapsedTime)}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{playerBName}</p>
                  <p className="text-xs text-muted-foreground">{playerBRating}</p>
                </div>
              </div>
            </div>

            {/* Problem preview - blurred */}
            <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Current Problem</p>
              <div className="blur-sm select-none">
                <p className="text-sm text-foreground">
                  Find all integers n such that n² + 2n + 4...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No live games right now</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start a duel to go live!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
