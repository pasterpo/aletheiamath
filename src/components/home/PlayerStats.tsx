import { useQuery } from '@tanstack/react-query';
import { Users, Gamepad2, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function PlayerStats() {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active duels
      const { count: activeDuels } = await supabase
        .from('duels')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get today's problems solved
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: problemsToday } = await supabase
        .from('user_attempted_problems')
        .select('*', { count: 'exact', head: true })
        .gte('attempted_at', today.toISOString());

      // Get active tournaments
      const { count: activeTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        users: usersCount || 0,
        duels: activeDuels || 0,
        problemsToday: problemsToday || 0,
        tournaments: activeTournaments || 0,
      };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="font-medium text-foreground">{stats?.users || 0}</span>
        <span>players</span>
      </div>
      
      <div className="flex items-center gap-2 text-muted-foreground">
        <Gamepad2 className="h-4 w-4" />
        <span className="font-medium text-foreground">{stats?.duels || 0}</span>
        <span>duels live</span>
      </div>

      {(stats?.tournaments || 0) > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-4 w-4" />
          <span className="font-medium text-foreground">{stats?.tournaments}</span>
          <span>tournaments</span>
        </div>
      )}
    </div>
  );
}
