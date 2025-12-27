import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function PuzzleOfTheDay() {
  const { user } = useAuth();

  // Get a random published problem for the day
  const { data: puzzle, isLoading } = useQuery({
    queryKey: ['puzzle-of-the-day'],
    queryFn: async () => {
      // Get today's date as a seed for consistent daily puzzle
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      
      // Get all published problems
      const { data: problems, error } = await supabase
        .from('problems')
        .select('id, title, statement, difficulty, topic')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error || !problems?.length) return null;

      // Use seed to pick a consistent puzzle for the day
      const index = seed % problems.length;
      return problems[index];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Check if user has solved today's puzzle
  const { data: solved } = useQuery({
    queryKey: ['puzzle-solved', puzzle?.id, user?.id],
    queryFn: async () => {
      if (!user || !puzzle) return false;

      const { data } = await supabase
        .from('user_attempted_problems')
        .select('result')
        .eq('user_id', user.id)
        .eq('problem_id', puzzle.id)
        .eq('result', 'correct')
        .maybeSingle();

      return !!data;
    },
    enabled: !!user && !!puzzle,
  });

  const difficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'text-green-500';
    if (difficulty <= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const difficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    return 'Hard';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
        <div className="h-5 bg-secondary rounded w-1/2 mb-4" />
        <div className="h-24 bg-secondary rounded" />
      </div>
    );
  }

  if (!puzzle) {
    return null;
  }

  return (
    <Link 
      to="/aletheia-rating"
      className="block bg-card rounded-xl border border-border overflow-hidden group hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-accent/10 border-b border-border">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Puzzle of the Day</span>
        </div>
        {solved && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Solved
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className={cn("text-xs font-medium", difficultyColor(puzzle.difficulty || 5))}>
            {difficultyLabel(puzzle.difficulty || 5)}
          </span>
          {puzzle.topic && (
            <span className="text-xs text-muted-foreground">{puzzle.topic}</span>
          )}
        </div>

        {/* Problem preview */}
        <p className="text-sm text-foreground line-clamp-3 mb-3">
          {puzzle.statement.substring(0, 150)}...
        </p>

        {/* CTA */}
        <div className="flex items-center justify-end text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
          {solved ? 'View Solution' : 'Solve Now'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      </div>
    </Link>
  );
}
