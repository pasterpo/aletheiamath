import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStatsData {
  id: string;
  user_id: string;
  rating: number | null;
  total_points: number | null;
  problems_solved: number | null;
  duels_won: number | null;
  duels_played: number | null;
  current_streak: number | null;
  longest_streak: number | null;
}

export function useUserStatsById(userId: string | null) {
  return useQuery({
    queryKey: ['user-stats-by-id', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserStatsData | null;
    },
    enabled: !!userId,
  });
}
