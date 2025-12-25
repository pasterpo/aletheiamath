import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'friend_request' | 'duel_challenge' | 'message';
  from_user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  from_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return { friendRequests: 0, unreadMessages: 0, total: 0 };

      // Count pending friend requests
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Count unread messages
      const { count: msgCount } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Count waiting duels where user is opponent (challenges)
      const { count: duelCount } = await supabase
        .from('duels')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')
        .neq('challenger_id', user.id);

      return {
        friendRequests: friendCount || 0,
        unreadMessages: msgCount || 0,
        duelChallenges: duelCount || 0,
        total: (friendCount || 0) + (msgCount || 0),
      };
    },
    enabled: !!user,
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Remove any existing friendship
      await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${blockedUserId}),and(user_id.eq.${blockedUserId},friend_id.eq.${user.id})`);

      // Could add to a block list table if needed
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}
