import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profile?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
  };
}

export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all accepted friendships where user is either the sender or receiver
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Get all friend user IDs (the OTHER person in the friendship)
      const friendIds = data?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) return [];

      // Fetch profiles for all friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', friendIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Return friendships with the friend's profile attached
      return data?.map(f => {
        const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
        return {
          ...f,
          profile: profileMap.get(friendUserId)
        };
      }) as Friendship[];
    },
    enabled: !!user,
  });
}

export function useFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get pending requests where current user is the recipient
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const senderIds = data?.map(f => f.user_id) || [];
      if (senderIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data?.map(f => ({
        ...f,
        profile: profileMap.get(f.user_id)
      })) as Friendship[];
    },
    enabled: !!user,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        throw new Error('Friend request already exists');
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { error } = await supabase
        .from('friendships')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}
