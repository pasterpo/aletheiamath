import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('blocked_users')
        .select('blocked_id, created_at')
        .eq('blocker_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useIsBlocked(userId: string) {
  const { data: blockedUsers = [] } = useBlockedUsers();
  return blockedUsers.some((b: any) => b.blocked_id === userId);
}

export function useBlockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Block the user
      const { error: blockError } = await (supabase as any)
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: blockedId });

      if (blockError) throw blockError;

      // Also remove any existing friendship
      await supabase
        .from('friendships')
        .delete()
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .or(`user_id.eq.${blockedId},friend_id.eq.${blockedId}`);

      return blockedId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useUnblockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;
      return blockedId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
  });
}
