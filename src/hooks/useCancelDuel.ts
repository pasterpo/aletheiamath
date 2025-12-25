import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCancelDuel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (duelId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('duels')
        .delete()
        .eq('id', duelId)
        .eq('challenger_id', user.id)
        .eq('status', 'waiting');

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });
}
