import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAchievements, useMyAchievements, Achievement, UserAchievement } from '@/hooks/useLeaderboard';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
import { Award, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AchievementsDisplayProps {
  userId?: string;
}

export function AchievementsDisplay({ userId }: AchievementsDisplayProps) {
  const { data: allAchievements = [], isLoading: loadingAll } = useAchievements();
  
  // Fetch achievements for specific user
  const { data: userAchievements = [], isLoading: loadingUser } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
    enabled: !!userId,
  });

  const isLoading = loadingAll || loadingUser;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const earnedMap = new Map(
    userAchievements.map(ua => [ua.achievement_id, ua])
  );

  const earnedCount = userAchievements.length;
  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);

  // Group achievements by category
  const categorized = allAchievements.reduce((acc, achievement) => {
    const cat = achievement.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryLabels: Record<string, string> = {
    problems: 'Problem Solving',
    rating: 'Rating Milestones',
    duels: 'Duel Victories',
    streaks: 'Activity Streaks',
    other: 'Other',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-primary">{earnedCount}</span>/{allAchievements.length} unlocked
            <span className="mx-2">·</span>
            <span className="font-bold text-primary">{totalPoints}</span> pts
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(categorized).map(([category, achievements]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {categoryLabels[category] || category}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  earned={earnedMap.get(achievement.id)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
