import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  problems_solved: number;
  duels_won: number;
  duels_played: number;
  videos_watched: number;
  current_streak: number;
  longest_streak: number;
  rating: number;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: string | null;
  points: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      // Get stats first
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(limit);
      
      if (statsError) throw statsError;
      if (!stats || stats.length === 0) return [] as UserStats[];
      
      // Get profiles for these users
      const userIds = stats.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      // Merge profiles with stats
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return stats.map(stat => ({
        ...stat,
        profile: profileMap.get(stat.user_id) as { full_name: string | null; avatar_url: string | null } | undefined,
      })) as UserStats[];
    },
  });
}

export function useMyStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserStats | null;
    },
    enabled: !!user,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points');
      
      if (error) throw error;
      return data as Achievement[];
    },
  });
}

export function useMyAchievements() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });
}

export function useInitializeStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if stats exist
      const { data: existing } = await supabase
        .from('user_stats')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) return existing;
      
      const { data, error } = await supabase
        .from('user_stats')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
    },
  });
}
