import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const FREE_SKIPS_PER_DAY = 3;
const SKIP_PENALTY = -30;

export function useGlobalSkips() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['global-skips', user?.id, today],
    queryFn: async () => {
      if (!user) return { skipCount: 0, remaining: FREE_SKIPS_PER_DAY, canSkipFree: true };

      const { data, error } = await (supabase as any)
        .from('user_global_daily_skips')
        .select('skip_count')
        .eq('user_id', user.id)
        .eq('skip_date', today)
        .maybeSingle();

      if (error) throw error;

      const skipCount = data?.skip_count || 0;
      const remaining = Math.max(0, FREE_SKIPS_PER_DAY - skipCount);
      const canSkipFree = skipCount < FREE_SKIPS_PER_DAY;

      return { skipCount, remaining, canSkipFree };
    },
    enabled: !!user,
  });
}

export function useRecordGlobalSkip() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async (problemId: string) => {
      if (!user) throw new Error('Not authenticated');

      // First record the attempt as skipped
      await (supabase as any)
        .from('user_attempted_problems')
        .insert({
          user_id: user.id,
          problem_id: problemId,
          result: 'skipped',
        });

      // Get current skip count for today
      const { data: existingSkip } = await (supabase as any)
        .from('user_global_daily_skips')
        .select('id, skip_count')
        .eq('user_id', user.id)
        .eq('skip_date', today)
        .maybeSingle();

      const currentSkipCount = existingSkip?.skip_count || 0;
      const isFreeSkip = currentSkipCount < FREE_SKIPS_PER_DAY;

      // Update or insert skip record
      if (existingSkip) {
        await (supabase as any)
          .from('user_global_daily_skips')
          .update({ skip_count: currentSkipCount + 1 })
          .eq('id', existingSkip.id);
      } else {
        await (supabase as any)
          .from('user_global_daily_skips')
          .insert({
            user_id: user.id,
            skip_date: today,
            skip_count: 1,
          });
      }

      // Apply rating penalty if not a free skip
      if (!isFreeSkip) {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('rating')
          .eq('user_id', user.id)
          .maybeSingle();

        const newRating = Math.max(0, (stats?.rating || 1000) + SKIP_PENALTY);

        if (stats) {
          await supabase
            .from('user_stats')
            .update({ 
              rating: newRating,
              last_activity_at: new Date().toISOString() 
            })
            .eq('user_id', user.id);
        }

        return { appliedPenalty: true, penalty: SKIP_PENALTY, remaining: 0 };
      }

      return { 
        appliedPenalty: false, 
        penalty: 0, 
        remaining: FREE_SKIPS_PER_DAY - currentSkipCount - 1 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-skips'] });
      queryClient.invalidateQueries({ queryKey: ['attempted-problems'] });
      queryClient.invalidateQueries({ queryKey: ['my-rating'] });
    },
  });
}
