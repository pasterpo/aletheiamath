import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Target, Flame, Swords, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TournamentStatsProps {
  userId?: string | null;
}

interface TournamentHistory {
  id: string;
  tournament_id: string;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  joined_at: string;
  tournament?: {
    id: string;
    name: string;
    tournament_type: string;
    status: string;
    start_time: string;
    duration_minutes: number;
  };
}

export function TournamentStats({ userId }: TournamentStatsProps) {
  const { data: tournamentHistory, isLoading } = useQuery({
    queryKey: ['tournament-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`
          id,
          tournament_id,
          score,
          wins,
          losses,
          draws,
          joined_at,
          tournament:tournaments(id, name, tournament_type, status, start_time, duration_minutes)
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as TournamentHistory[];
    },
    enabled: !!userId,
  });

  // Calculate aggregated stats
  const stats = tournamentHistory?.reduce((acc, t) => ({
    totalTournaments: acc.totalTournaments + 1,
    totalWins: acc.totalWins + t.wins,
    totalLosses: acc.totalLosses + t.losses,
    totalDraws: acc.totalDraws + t.draws,
    totalPoints: acc.totalPoints + t.score,
    finishedTournaments: acc.finishedTournaments + (t.tournament?.status === 'finished' ? 1 : 0),
  }), {
    totalTournaments: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    totalPoints: 0,
    finishedTournaments: 0,
  }) || {
    totalTournaments: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    totalPoints: 0,
    finishedTournaments: 0,
  };

  // Find best placement
  const sortedByScore = [...(tournamentHistory || [])].sort((a, b) => b.score - a.score);
  const bestScore = sortedByScore[0]?.score || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Tournament Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.totalTournaments}</p>
            <p className="text-xs text-muted-foreground">Tournaments Played</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 text-center">
            <Swords className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.totalWins}</p>
            <p className="text-xs text-muted-foreground">Games Won</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.totalPoints}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-4 text-center">
            <Medal className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{bestScore}</p>
            <p className="text-xs text-muted-foreground">Best Score</p>
          </div>
        </div>

        {/* Win/Loss Ratio */}
        {stats.totalWins + stats.totalLosses > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-medium">
                {Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ 
                  width: `${(stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.totalWins}W</span>
              <span>{stats.totalDraws}D</span>
              <span>{stats.totalLosses}L</span>
            </div>
          </div>
        )}

        {/* Recent Tournaments */}
        {tournamentHistory && tournamentHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Recent Tournaments</h4>
            <div className="space-y-2">
              {tournamentHistory.slice(0, 5).map((t) => (
                <div 
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="font-medium text-sm">
                        {t.tournament?.name || 'Tournament'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {t.tournament?.start_time 
                          ? format(new Date(t.tournament.start_time), 'MMM d, yyyy')
                          : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={t.tournament?.status === 'finished' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {t.tournament?.tournament_type}
                    </Badge>
                    <p className="text-sm font-bold mt-1">{t.score} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {t.wins}W {t.losses}L {t.draws}D
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!tournamentHistory || tournamentHistory.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tournament history yet</p>
            <p className="text-sm">Join a tournament to start competing!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
