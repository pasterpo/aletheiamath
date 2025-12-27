import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, Clock, Flame, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_time: string;
  duration_minutes: number;
  participant_count?: number;
}

export function TournamentSidebar() {
  const { data: tournaments } = useQuery({
    queryKey: ['home-tournaments'],
    queryFn: async () => {
      // Get active and upcoming tournaments
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, start_time, duration_minutes')
        .in('status', ['active', 'scheduled'])
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Get participant counts
      const tournamentIds = data?.map(t => t.id) || [];
      const { data: participants } = await supabase
        .from('tournament_participants')
        .select('tournament_id')
        .in('tournament_id', tournamentIds);

      const countMap: Record<string, number> = {};
      participants?.forEach(p => {
        countMap[p.tournament_id] = (countMap[p.tournament_id] || 0) + 1;
      });

      return data?.map(t => ({
        ...t,
        participant_count: countMap[t.id] || 0
      })) as Tournament[];
    },
    refetchInterval: 30000,
  });

  const getStatusBadge = (tournament: Tournament) => {
    if (tournament.status === 'active') {
      return (
        <span className="flex items-center gap-1 text-xs text-green-500">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Playing now
        </span>
      );
    }

    const startTime = new Date(tournament.start_time);
    if (isFuture(startTime)) {
      return (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(startTime, { addSuffix: true })}
        </span>
      );
    }

    return null;
  };

  const getIcon = (tournament: Tournament) => {
    if (tournament.status === 'active') {
      return <Flame className="h-4 w-4 text-orange-500" />;
    }
    return <Trophy className="h-4 w-4 text-accent" />;
  };

  return (
    <div className="space-y-2">
      {/* Active tournaments */}
      {tournaments?.filter(t => t.status === 'active').map(tournament => (
        <Link
          key={tournament.id}
          to={`/tournaments/${tournament.id}`}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            "bg-green-500/10 border border-green-500/20",
            "hover:bg-green-500/15 transition-colors"
          )}
        >
          {getIcon(tournament)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {tournament.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(tournament)}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tournament.participant_count}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
        </Link>
      ))}

      {/* Upcoming tournaments */}
      {tournaments?.filter(t => t.status === 'scheduled').map(tournament => (
        <Link
          key={tournament.id}
          to={`/tournaments/${tournament.id}`}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg",
            "bg-secondary/50 border border-transparent",
            "hover:bg-secondary hover:border-border transition-colors"
          )}
        >
          {getIcon(tournament)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {tournament.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(tournament)}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tournament.participant_count}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
        </Link>
      ))}

      {/* Empty state */}
      {(!tournaments || tournaments.length === 0) && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No tournaments scheduled
        </div>
      )}

      {/* View all link */}
      <Link
        to="/tournaments"
        className="block text-center text-sm text-primary hover:underline py-2"
      >
        View all tournaments →
      </Link>
    </div>
  );
}
