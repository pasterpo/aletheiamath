import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Duel {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  problem_id: string | null;
  status: string;
  challenger_answer: string | null;
  opponent_answer: string | null;
  challenger_time_seconds: number | null;
  opponent_time_seconds: number | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  problem?: {
    id: string;
    title: string;
    statement: string;
    difficulty: number | null;
  };
}

export function useAvailableDuels() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['duels', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          problem:problems(id, title, statement, difficulty)
        `)
        .eq('status', 'waiting')
        .neq('challenger_id', user?.id || '')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Duel[];
    },
  });
}

export function useMyDuels() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['duels', 'my', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('duels')
        .select(`
          *,
          problem:problems(id, title, statement, difficulty)
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Duel[];
    },
    enabled: !!user,
  });
}

export function useCreateDuel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (problemId?: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // If no problem specified, get a random published one
      let selectedProblemId = problemId;
      if (!selectedProblemId) {
        const { data: problems } = await supabase
          .from('problems')
          .select('id')
          .eq('is_published', true);
        
        if (problems && problems.length > 0) {
          selectedProblemId = problems[Math.floor(Math.random() * problems.length)].id;
        } else {
          throw new Error('No problems available for duels');
        }
      }
      
      const { data, error } = await supabase
        .from('duels')
        .insert({
          challenger_id: user.id,
          problem_id: selectedProblemId,
          status: 'waiting',
        })
        .select(`
          *,
          problem:problems(id, title, statement, difficulty)
        `)
        .single();
      
      if (error) throw error;
      return data as Duel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });
}

export function useJoinDuel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (duelId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('duels')
        .update({
          opponent_id: user.id,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', duelId)
        .eq('status', 'waiting')
        .select(`
          *,
          problem:problems(id, title, statement, difficulty)
        `)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Duel not available');
      return data as Duel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });
}

export function useSubmitDuelAnswer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ duelId, answer, timeSeconds }: { 
      duelId: string; 
      answer: string; 
      timeSeconds: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get current duel to determine if user is challenger or opponent
      const { data: duel } = await supabase
        .from('duels')
        .select('*')
        .eq('id', duelId)
        .single();
      
      if (!duel) throw new Error('Duel not found');
      
      const isChallenger = duel.challenger_id === user.id;
      const updateData = isChallenger
        ? { challenger_answer: answer, challenger_time_seconds: timeSeconds }
        : { opponent_answer: answer, opponent_time_seconds: timeSeconds };
      
      // Check if both have answered
      const otherAnswered = isChallenger ? duel.opponent_answer : duel.challenger_answer;
      if (otherAnswered) {
        // Complete the duel - for now, faster time wins
        const challengerTime = isChallenger ? timeSeconds : duel.challenger_time_seconds;
        const opponentTime = isChallenger ? duel.opponent_time_seconds : timeSeconds;
        
        let winnerId = null;
        if (challengerTime && opponentTime) {
          winnerId = challengerTime <= opponentTime ? duel.challenger_id : duel.opponent_id;
        }
        
        Object.assign(updateData, {
          status: 'completed',
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        });
      }
      
      const { data, error } = await supabase
        .from('duels')
        .update(updateData)
        .eq('id', duelId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });
}
