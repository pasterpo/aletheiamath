import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProblemStat {
  id: string;
  problem_id: string;
  topic: string | null;
  subtopic: string | null;
  difficulty: number | null;
  is_correct: boolean;
  time_taken_seconds: number | null;
  rating_change: number;
  source: string;
  created_at: string;
}

export interface TopicPerformance {
  topic: string;
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
}

export function useUserProblemStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-problem-stats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_problem_stats')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProblemStat[];
    },
    enabled: !!targetUserId,
  });
}

export function useRatingHistory(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['rating-history', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('rating_history')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
  });
}

export function useTopicPerformance(userId?: string) {
  const { data: stats } = useUserProblemStats(userId);

  // Calculate performance by topic
  const topicStats = stats?.reduce((acc, stat) => {
    const topic = stat.topic || 'Uncategorized';
    if (!acc[topic]) {
      acc[topic] = { correct: 0, incorrect: 0, total: 0 };
    }
    acc[topic].total++;
    if (stat.is_correct) {
      acc[topic].correct++;
    } else {
      acc[topic].incorrect++;
    }
    return acc;
  }, {} as Record<string, { correct: number; incorrect: number; total: number }>);

  const performance: TopicPerformance[] = Object.entries(topicStats || {}).map(([topic, data]) => ({
    topic,
    ...data,
    percentage: Math.round((data.correct / data.total) * 100),
  }));

  return performance;
}

export function useUserStatsSummary(userId?: string) {
  const { data: stats } = useUserProblemStats(userId);

  if (!stats || stats.length === 0) {
    return {
      totalProblems: 0,
      correctCount: 0,
      incorrectCount: 0,
      solveRate: 0,
      averageTime: 0,
      difficultyDistribution: [],
    };
  }

  const totalProblems = stats.length;
  const correctCount = stats.filter(s => s.is_correct).length;
  const incorrectCount = totalProblems - correctCount;
  const solveRate = Math.round((correctCount / totalProblems) * 100);
  
  const timesWithValues = stats.filter(s => s.time_taken_seconds).map(s => s.time_taken_seconds!);
  const averageTime = timesWithValues.length > 0
    ? Math.round(timesWithValues.reduce((a, b) => a + b, 0) / timesWithValues.length)
    : 0;

  // Difficulty distribution
  const diffBuckets: Record<number, { correct: number; total: number }> = {};
  stats.forEach(s => {
    const diff = s.difficulty || 50;
    if (!diffBuckets[diff]) {
      diffBuckets[diff] = { correct: 0, total: 0 };
    }
    diffBuckets[diff].total++;
    if (s.is_correct) diffBuckets[diff].correct++;
  });

  const difficultyDistribution = Object.entries(diffBuckets)
    .map(([diff, data]) => ({
      difficulty: parseInt(diff),
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100),
    }))
    .sort((a, b) => a.difficulty - b.difficulty);

  return {
    totalProblems,
    correctCount,
    incorrectCount,
    solveRate,
    averageTime,
    difficultyDistribution,
  };
}
