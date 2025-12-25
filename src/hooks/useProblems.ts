import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProblemCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

export interface Problem {
  id: string;
  category_id: string | null;
  title: string;
  statement: string;
  hints: string[] | null;
  solution: string | null;
  source: string | null;
  year: number | null;
  difficulty: number | null;
  tags: string[] | null;
  answer: string | null;
  answer_type: string | null;
  category?: ProblemCategory;
}

export interface SolutionSubmission {
  id: string;
  user_id: string;
  problem_id: string;
  solution_text: string;
  status: string;
  feedback: string | null;
  points_earned: number;
  submitted_at: string;
}

export function useProblemCategories() {
  return useQuery({
    queryKey: ['problem-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('problem_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ProblemCategory[];
    },
  });
}

export function useProblems(categorySlug?: string, difficulty?: number) {
  return useQuery({
    queryKey: ['problems', categorySlug, difficulty],
    queryFn: async () => {
      let query = supabase
        .from('problems')
        .select(`
          *,
          category:problem_categories(*)
        `)
        .eq('is_published', true)
        .order('difficulty');
      
      if (categorySlug) {
        const { data: category } = await supabase
          .from('problem_categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }
      
      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Problem[];
    },
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: ['problem', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('problems')
        .select(`
          *,
          category:problem_categories(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Problem | null;
    },
    enabled: !!id,
  });
}

export function useUserSubmissions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('solution_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as SolutionSubmission[];
    },
    enabled: !!user,
  });
}

export function useSubmitSolution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ problemId, solutionText }: { 
      problemId: string; 
      solutionText: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('solution_submissions')
        .insert({
          user_id: user.id,
          problem_id: problemId,
          solution_text: solutionText,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}
