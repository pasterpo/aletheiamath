import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAX_SKIPS_PER_DAY = 3;

export interface DailySkip {
  id: string;
  user_id: string;
  category_id: string;
  skip_count: number;
  skip_date: string;
}

export function useSkipsForCategory(categoryId: string | null) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['daily-skips', user?.id, categoryId, today],
    queryFn: async () => {
      if (!user || !categoryId) return { skipCount: 0, canSkip: true };

      const { data, error } = await supabase
        .from('user_daily_skips')
        .select('skip_count')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('skip_date', today)
        .maybeSingle();

      if (error) throw error;

      const skipCount = data?.skip_count || 0;
      return {
        skipCount,
        canSkip: skipCount < MAX_SKIPS_PER_DAY,
        remaining: MAX_SKIPS_PER_DAY - skipCount,
      };
    },
    enabled: !!user && !!categoryId,
  });
}

export function useRecordSkip() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check current skip count
      const { data: existing, error: fetchError } = await supabase
        .from('user_daily_skips')
        .select('id, skip_count')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('skip_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        if (existing.skip_count >= MAX_SKIPS_PER_DAY) {
          throw new Error('Maximum skips reached for this category today');
        }

        const { error } = await supabase
          .from('user_daily_skips')
          .update({ skip_count: existing.skip_count + 1 })
          .eq('id', existing.id);

        if (error) throw error;
        return existing.skip_count + 1;
      } else {
        const { error } = await supabase
          .from('user_daily_skips')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            skip_count: 1,
            skip_date: today,
          });

        if (error) throw error;
        return 1;
      }
    },
    onSuccess: (_, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ['daily-skips', user?.id, categoryId] });
    },
  });
}

export function useAllSkipsToday() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['all-daily-skips', user?.id, today],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_daily_skips')
        .select('category_id, skip_count')
        .eq('user_id', user.id)
        .eq('skip_date', today);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
