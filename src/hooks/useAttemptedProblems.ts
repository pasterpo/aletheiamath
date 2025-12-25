import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AttemptedProblem {
  id: string;
  user_id: string;
  problem_id: string;
  result: 'correct' | 'incorrect' | 'skipped';
  attempted_at: string;
}

export function useAttemptedProblems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attempted-problems', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('user_attempted_problems')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as AttemptedProblem[];
    },
    enabled: !!user,
  });
}

export function useAttemptedProblemIds() {
  const { data: attempted = [] } = useAttemptedProblems();
  return new Set(attempted.map(a => a.problem_id));
}
