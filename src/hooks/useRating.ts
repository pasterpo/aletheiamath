import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserRating {
  user_id: string;
  rating: number;
  total_points: number;
  problems_solved: number;
}

// Rating change based on difficulty (1-10)
export function calculateRatingChange(difficulty: number, correct: boolean): number {
  // Base rating change scales with difficulty
  // Easy (1-3): ±10-20, Medium (4-6): ±25-40, Hard (7-10): ±50-80
  const baseChange = 10 + (difficulty * 7);
  
  // Correct answers give full points, wrong answers lose slightly less
  return correct ? baseChange : -Math.floor(baseChange * 0.8);
}

export function useMyRating() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-rating', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_stats')
        .select('user_id, rating, total_points, problems_solved')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserRating | null;
    },
    enabled: !!user,
  });
}

export function useUpdateRating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ratingChange, 
      pointsChange,
      solved 
    }: { 
      ratingChange: number; 
      pointsChange: number;
      solved: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // First get current stats
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('rating, total_points, problems_solved')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const newRating = Math.max(0, (currentStats?.rating || 1000) + ratingChange);
      const newPoints = Math.max(0, (currentStats?.total_points || 0) + (pointsChange > 0 ? pointsChange : 0));
      const newSolved = (currentStats?.problems_solved || 0) + (solved ? 1 : 0);

      // Update or insert stats
      if (currentStats) {
        const { error } = await supabase
          .from('user_stats')
          .update({
            rating: newRating,
            total_points: newPoints,
            problems_solved: newSolved,
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            rating: 1000 + ratingChange,
            total_points: pointsChange > 0 ? pointsChange : 0,
            problems_solved: solved ? 1 : 0,
          });

        if (error) throw error;
      }

      return { newRating, newPoints, newSolved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rating'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
